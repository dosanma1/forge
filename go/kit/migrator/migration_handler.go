package migrator

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
)

// MigrationHandler orchestrates the entire migration process
type MigrationHandler struct {
	cfg             *configuration
	monitor         monitoring.Monitor
	db              *gormcli.DBClient
	scriptExecutor  *ScriptExecutor
	migrationRunner *MigrationRunner
}

// NewMigrationHandler creates a new migration handler
func NewMigrationHandler(
	cfg *configuration,
	monitor monitoring.Monitor,
	db *gormcli.DBClient,
) *MigrationHandler {
	return &MigrationHandler{
		cfg:             cfg,
		monitor:         monitor,
		db:              db,
		scriptExecutor:  NewScriptExecutor(monitor, db),
		migrationRunner: NewMigrationRunner(monitor, db),
	}
}

// newMigrationHandler creates an FX handler function
func newMigrationHandler(cfg *configuration) func(
	lc fx.Lifecycle,
	shutdowner fx.Shutdowner,
	monitor monitoring.Monitor,
	db *gormcli.DBClient,
) {
	return func(
		lc fx.Lifecycle,
		shutdowner fx.Shutdowner,
		monitor monitoring.Monitor,
		db *gormcli.DBClient,
	) {
		handler := NewMigrationHandler(cfg, monitor, db)

		lc.Append(fx.Hook{
			OnStart: func(appCtx context.Context) error {
				trace := monitor.Tracer()
				ctx, _ := trace.Start(context.Background(), tracer.WithName("migrator-"+cfg.ServiceName), tracer.WithSpanKind(tracer.SpanKindInternal))

				err := handler.StartMigration(ctx)

				// Always call exitApp to handle shutdown properly
				go func() {
					handler.exitApp(ctx, shutdowner, err)
				}()

				// Don't return the error to FX, let exitApp handle the exit code
				return nil
			},
			OnStop: func(ctx context.Context) error {
				monitor.Logger().DebugContext(ctx, "Migration OnStop")
				return nil
			},
		})
	}
}

// StartMigration orchestrates the complete migration process
func (mh *MigrationHandler) StartMigration(ctx context.Context) error {
	logger := mh.monitor.Logger()

	// Log migration start
	logger.InfoContext(ctx, "🚀 Starting migration process")
	logger.InfoContext(ctx, fmt.Sprintf("📊 Migration configuration: project=%s, service=%s, direction=%s",
		mh.cfg.MigrateProject, mh.cfg.ServiceName, mh.cfg.migrateDirection))

	// Validate migration direction
	if mh.cfg.migrateDirection != up && mh.cfg.migrateDirection != down {
		err := fields.NewWrappedErr("invalid migration direction '%s', must be 'up' or 'down': %v",
			mh.cfg.migrateDirection, errInvalidMigrationDirection)
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Migration validation failed: %s", err.Error()))
		return err
	}

	// Execute pre-migration scripts
	if mh.cfg.forceExecutionPreMigrationScripts || mh.cfg.migrateDirection == up {
		logger.InfoContext(ctx, "🔄 Executing pre-migration scripts...")
		err := mh.scriptExecutor.ExecuteScripts(ctx, commonPreMigrationScriptPath, "pre-migration", mh.cfg)
		if err != nil {
			err = fields.NewWrappedErr("pre-migration scripts failed for project %s: %v", mh.cfg.MigrateProject, err)
			logger.ErrorContext(ctx, fmt.Sprintf("❌ Pre-migration failed: %s", err.Error()))
			return err
		}
		logger.InfoContext(ctx, "✅ Pre-migration scripts completed successfully")
	} else {
		logger.InfoContext(ctx, fmt.Sprintf("⏭️  Skipping pre-migration scripts (direction=%s, force=%t)",
			mh.cfg.migrateDirection, mh.cfg.forceExecutionPreMigrationScripts))
	}

	// Run migrations
	var migrationErr error
	if mh.cfg.MigrateProject == "trading-bot" {
		logger.InfoContext(ctx, "🔄 Running migrations for trading-bot project (multiple services)")
		migrationErr = mh.migrationRunner.RunMultiServiceMigration(ctx, mh.cfg)
	} else {
		logger.InfoContext(ctx, fmt.Sprintf("🔄 Running migration for single service: %s", mh.cfg.MigrateProject))
		migrationErr = mh.migrationRunner.RunServiceMigration(ctx, mh.cfg.MigrateProject, mh.cfg)
	}

	if migrationErr != nil {
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Migration execution failed: %s", migrationErr.Error()))
		return migrationErr
	}

	// Execute post-migration scripts
	if mh.cfg.forceExecutionPostMigrationScripts || mh.cfg.migrateDirection == up {
		logger.InfoContext(ctx, "🔄 Executing post-migration scripts...")
		err := mh.scriptExecutor.ExecuteScripts(ctx, commonPostMigrationScriptPath, "post-migration", mh.cfg)
		if err != nil {
			err = fields.NewWrappedErr("post-migration scripts failed for project %s: %v", mh.cfg.MigrateProject, err)
			logger.ErrorContext(ctx, fmt.Sprintf("❌ Post-migration failed: %s", err.Error()))
			return err
		}
		logger.InfoContext(ctx, "✅ Post-migration scripts completed successfully")
	} else {
		logger.InfoContext(ctx, fmt.Sprintf("⏭️  Skipping post-migration scripts (direction=%s, force=%t)",
			mh.cfg.migrateDirection, mh.cfg.forceExecutionPostMigrationScripts))
	}

	logger.InfoContext(ctx, fmt.Sprintf("🎉 Migration process completed successfully for %s", mh.cfg.MigrateProject))
	return nil
}

// exitApp handles the application exit with proper cleanup and reporting
func (mh *MigrationHandler) exitApp(
	ctx context.Context,
	shutdowner fx.Shutdowner,
	err error,
) {
	logger := mh.monitor.Logger()

	errCode := 0
	if err == nil {
		logger.InfoContext(ctx, "🎉 Migration process completed successfully")
		logger.InfoContext(ctx, fmt.Sprintf("📊 Final status: project=%s, service=%s, direction=%s",
			mh.cfg.MigrateProject, mh.cfg.ServiceName, mh.cfg.migrateDirection))
	} else {
		errCode = 1
		logger.ErrorContext(ctx, "💥 Migration process failed")
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Error details: %s", err.Error()))
		logger.ErrorContext(ctx, fmt.Sprintf("📊 Failed configuration: project=%s, service=%s, direction=%s",
			mh.cfg.MigrateProject, mh.cfg.ServiceName, mh.cfg.migrateDirection))

		// Fail fast: exit immediately with error code
		logger.ErrorContext(ctx, fmt.Sprintf("🚫 Failing fast - exiting immediately with error code %d", errCode))
		logger.ErrorContext(ctx, "🔄 Fix the issue and redeploy. No retries will be attempted.")
	}

	// End tracing span
	span := mh.monitor.Tracer().SpanFromContext(ctx)
	if span != nil {
		mh.monitor.Tracer().End(span)
	}

	// Give time for telemetry to be sent
	logger.DebugContext(ctx, "⏳ Waiting %v for telemetry data to be sent...", timeoutBeforeShutdown)
	time.Sleep(timeoutBeforeShutdown)

	logger.DebugContext(ctx, "🚪 Shutting down with exit code: %d", errCode)
	_ = shutdowner.Shutdown(fx.ExitCode(errCode))
}
