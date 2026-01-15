package fixtures

import (
	"context"
	"time"

	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
)

// FixtureHandler orchestrates the fixture loading process
type FixtureHandler struct {
	cfg           *configuration
	monitor       monitoring.Monitor
	db            *gormcli.DBClient
	fixtureRunner *FixtureRunner
}

// NewFixtureHandler creates a new fixture handler
func NewFixtureHandler(
	cfg *configuration,
	monitor monitoring.Monitor,
	db *gormcli.DBClient,
) *FixtureHandler {
	return &FixtureHandler{
		cfg:           cfg,
		monitor:       monitor,
		db:            db,
		fixtureRunner: NewFixtureRunner(monitor, db),
	}
}

// StartFixtureLoading orchestrates the simple fixture loading process
func (fh *FixtureHandler) StartFixtureLoading(ctx context.Context) error {
	logger := fh.monitor.Logger()

	// Log fixture loading start
	logger.InfoContext(ctx, "🚀 Starting fixture loading process")
	logger.InfoContext(ctx, "📊 Configuration: service=%s, dry-run=%t",
		fh.cfg.ServiceName, fh.cfg.dryRun)

	// Load fixtures
	logger.InfoContext(ctx, "🔄 Loading fixtures for service: %s", fh.cfg.ServiceName)
	err := fh.fixtureRunner.LoadFixtures(ctx, fh.cfg)
	if err != nil {
		logger.ErrorContext(ctx, "❌ Fixture loading failed: %s", err.Error())
		return err
	}

	logger.InfoContext(ctx, "🎉 Fixture loading process completed successfully for %s", fh.cfg.ServiceName)
	return nil
}

// exitApp handles the application exit with proper cleanup and reporting
func (fh *FixtureHandler) exitApp(
	ctx context.Context,
	shutdowner fx.Shutdowner,
	err error,
) {
	logger := fh.monitor.Logger()

	errCode := 0
	if err == nil {
		errCode = 0
		logger.InfoContext(ctx, "🎉 Fixture loading completed successfully")
		logger.InfoContext(ctx, "📊 Final status: service=%s", fh.cfg.ServiceName)
	} else {
		errCode = 1
		logger.ErrorContext(ctx, "💥 Fixture loading process failed")
		logger.ErrorContext(ctx, "❌ Error details: %s", err.Error())
		logger.ErrorContext(ctx, "📊 Failed configuration: service=%s", fh.cfg.ServiceName)

		// Fail fast: exit immediately with error code
		logger.ErrorContext(ctx, "🚫 Failing fast - exiting immediately with error code %d", errCode)
		logger.ErrorContext(ctx, "🔄 Fix the issue and redeploy. No retries will be attempted.")
	}

	// End tracing span
	span := fh.monitor.Tracer().SpanFromContext(ctx)
	if span != nil {
		fh.monitor.Tracer().End(span)
	}

	// Give time for telemetry to be sent
	logger.DebugContext(ctx, "⏳ Waiting %v for telemetry data to be sent...", timeoutBeforeShutdown)
	time.Sleep(timeoutBeforeShutdown)

	logger.DebugContext(ctx, "🚪 Shutting down with exit code: %d", errCode)
	_ = shutdowner.Shutdown(fx.ExitCode(errCode))
}
