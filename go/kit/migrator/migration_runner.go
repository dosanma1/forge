package migrator

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres" // PostgreSQL database driver for migrations
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
)

// MigrationRunner handles the execution of database migrations
type MigrationRunner struct {
	monitor monitoring.Monitor
	db      *gormcli.DBClient
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(monitor monitoring.Monitor, db *gormcli.DBClient) *MigrationRunner {
	return &MigrationRunner{
		monitor: monitor,
		db:      db,
	}
}

// RunServiceMigration executes migrations for a specific service
func (mr *MigrationRunner) RunServiceMigration(
	ctx context.Context,
	serviceName string,
	cfg *configuration,
) error {
	logger := mr.monitor.Logger()

	logger.InfoContext(ctx, "🔧 Initializing migration for service: %s", serviceName)
	logger.InfoContext(ctx, "📂 Migration direction: %s", cfg.migrateDirection)

	// Use migrations folder directly
	migrationsFolder := "migrations"

	// Read migrations from filesystem
	d, err := iofs.New(migrationFS, migrationsFolder)
	if err != nil {
		err = fields.NewWrappedErr("failed to read migrations folder '%s' for service %s: %v",
			migrationsFolder, serviceName, err)
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Migration driver initialization failed: %s", err.Error()))
		return err
	}

	// Create DSN with service-specific migration table
	serviceDSN := fmt.Sprintf("%s&x-migrations-table=%s_schema_migrations", cfg.dsn(), serviceName)
	logger.DebugContext(ctx, fmt.Sprintf("🔗 Using DSN with migration table: %s_schema_migrations", serviceName))

	// Initialize migrate instance
	m, err := migrate.NewWithSourceInstance("iofs", d, serviceDSN)
	if err != nil {
		err = fields.NewWrappedErr("failed to create migration instance for service %s: %v", serviceName, err)
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Migration instance creation failed: %s", err.Error()))
		return err
	}
	defer func() {
		if sourceErr, dbErr := m.Close(); sourceErr != nil || dbErr != nil {
			logger.WarnContext(ctx, fmt.Sprintf("⚠️  Failed to close migration instance - source: %v, db: %v", sourceErr, dbErr))
		}
	}()

	// Get current migration version before running
	currentVersion, dirty, err := m.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		logger.WarnContext(ctx, fmt.Sprintf("⚠️  Could not determine current migration version: %v", err))
	} else if errors.Is(err, migrate.ErrNilVersion) {
		logger.InfoContext(ctx, "📊 Current state: No migrations applied yet")
	} else {
		logger.InfoContext(ctx, fmt.Sprintf("📊 Current migration version: %d (dirty: %t)", currentVersion, dirty))
	}

	// Run the migration
	logger.InfoContext(ctx, fmt.Sprintf("⚡ Executing %s migration for service: %s", cfg.migrateDirection, serviceName))
	migrationErr := mr.runMigration(m, cfg.migrateDirection)

	if migrationErr != nil {
		if errors.Is(migrationErr, migrate.ErrNoChange) {
			logger.InfoContext(ctx, fmt.Sprintf("✅ No changes needed - service %s is already up to date", serviceName))
			return nil
		}

		// Enhanced error reporting for migration failures
		err = fields.NewWrappedErr("migration %s failed for service %s: %v",
			cfg.migrateDirection, serviceName, migrationErr)
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Migration execution failed: %s", err.Error()))

		// Try to get the current version after failure for debugging
		if failVersion, failDirty, versionErr := m.Version(); versionErr == nil {
			logger.ErrorContext(ctx, fmt.Sprintf("🐛 Migration failed at version: %d (dirty: %t)", failVersion, failDirty))
		}

		return err
	}

	// Get final migration version after successful run
	finalVersion, finalDirty, err := m.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		logger.WarnContext(ctx, fmt.Sprintf("⚠️  Could not determine final migration version: %v", err))
	} else if errors.Is(err, migrate.ErrNilVersion) {
		logger.InfoContext(ctx, "📊 Final state: All migrations rolled back")
	} else {
		logger.InfoContext(ctx, fmt.Sprintf("📊 Final migration version: %d (dirty: %t)", finalVersion, finalDirty))
	}

	logger.InfoContext(ctx, fmt.Sprintf("✅ Migration %s completed successfully for service: %s", cfg.migrateDirection, serviceName))
	return nil
}

// RunMultiServiceMigration executes migrations for multiple services in order
func (mr *MigrationRunner) RunMultiServiceMigration(
	ctx context.Context,
	cfg *configuration,
) error {
	logger := mr.monitor.Logger()

	// Define the order of services to migrate
	services := []string{"account", "workspace"}
	logger.InfoContext(ctx, fmt.Sprintf("📋 Services to migrate: %v", services))

	for i, service := range services {
		logger.InfoContext(ctx, fmt.Sprintf("🔄 [%d/%d] Starting migration for service: %s", i+1, len(services), service))

		err := mr.RunServiceMigration(ctx, service, cfg)
		if err != nil {
			err = fields.NewWrappedErr("migration failed for service %s (step %d/%d): %v",
				service, i+1, len(services), err)
			logger.ErrorContext(ctx, fmt.Sprintf("❌ Service migration failed: %s", err.Error()))
			return err
		}

		logger.InfoContext(ctx, fmt.Sprintf("✅ [%d/%d] Migration completed successfully for service: %s", i+1, len(services), service))
	}

	logger.InfoContext(ctx, "🎉 All service migrations completed successfully")
	return nil
}

// runMigration executes the migration in the specified direction
func (mr *MigrationRunner) runMigration(m *migrate.Migrate, migrateDirection string) error {
	switch migrateDirection {
	case up:
		return m.Up()
	case down:
		return m.Down()
	default:
		return fmt.Errorf("invalid migration direction: %s", migrateDirection)
	}
}
