package migrator

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

// migrator handles database migrations with pre/post script support.
type migrator struct {
	db          *sqldb.DBClient
	logger      logger.Logger
	serviceName string
}

// option configures a migrator.
type option func(*migrator)

// WithLogger sets a custom logger.
func WithLogger(log logger.Logger) option {
	return func(m *migrator) {
		m.logger = log
	}
}

// WithServiceName sets the service name for the migration table.
func WithServiceName(name string) option {
	return func(m *migrator) {
		m.serviceName = name
	}
}

// defaultOptions returns the default options for a migrator.
func defaultOptions() []option {
	return []option{
		WithLogger(logger.New()),
		WithServiceName("default"),
	}
}

// New creates a new migrator with the given database and options.
// DB parameter is required for explicit dependency management.
func New(db *sqldb.DBClient, opts ...option) (*migrator, error) {
	if db == nil {
		return nil, fmt.Errorf("db is required")
	}

	m := &migrator{
		db: db,
	}

	// Apply default options first, then user options
	for _, opt := range append(defaultOptions(), opts...) {
		opt(m)
	}

	return m, nil
}

// Run executes the migrations with pre/post scripts.
// Scripts always execute if present in migrationsFS.
// Expects migrationsFS structure:
//   - migrations/*.sql (actual migrations)
//   - migrations/common-pre-migration/*.sql (optional)
//   - migrations/common-post-migration/*.sql (optional)
func (m *migrator) Run(ctx context.Context, migrationsFS fs.FS) error {
	m.logger.Info("🚀 Starting migration process for service: %s", m.serviceName)

	// Execute pre-migration scripts (if present)
	if err := m.executeScripts(ctx, migrationsFS, "migrations/common-pre-migration", "pre-migration"); err != nil {
		return fmt.Errorf("pre-migration scripts failed: %w", err)
	}

	// Run actual migrations
	if err := m.runMigrations(ctx, migrationsFS); err != nil {
		return fmt.Errorf("migrations failed: %w", err)
	}

	// Execute post-migration scripts (if present)
	if err := m.executeScripts(ctx, migrationsFS, "migrations/common-post-migration", "post-migration"); err != nil {
		return fmt.Errorf("post-migration scripts failed: %w", err)
	}

	m.logger.Info("🎉 Migration completed successfully for service: %s", m.serviceName)
	return nil
}

// runMigrations executes the actual database migrations using golang-migrate.
func (m *migrator) runMigrations(ctx context.Context, migrationsFS fs.FS) error {
	m.logger.Info("📦 Running database migrations...")

	// Create source from embedded filesystem
	d, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations folder: %w", err)
	}

	// Build DSN with service-specific migration table
	dsn, err := sqldb.NewDSN(sqldb.DriverTypePostgres)
	if err != nil {
		return fmt.Errorf("failed to create DSN: %w", err)
	}

	// Add migration table parameter
	serviceDSN := fmt.Sprintf("%s&x-migrations-table=%s_schema_migrations", dsn, m.serviceName)

	// Create migrate instance
	migrator, err := migrate.NewWithSourceInstance("iofs", d, serviceDSN)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer func() {
		if srcErr, dbErr := migrator.Close(); srcErr != nil || dbErr != nil {
			m.logger.Warn("⚠️  Failed to close migrate instance: source=%v, db=%v", srcErr, dbErr)
		}
	}()

	// Get current version
	currentVersion, dirty, err := migrator.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		m.logger.Warn("⚠️  Could not determine current version: %v", err)
	} else if errors.Is(err, migrate.ErrNilVersion) {
		m.logger.Info("📊 No migrations applied yet")
	} else {
		m.logger.Info("📊 Current version: %d (dirty: %t)", currentVersion, dirty)
	}

	// Run migration up
	if err := migrator.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			m.logger.Info("✅ No new migrations to apply")
			return nil
		}
		return fmt.Errorf("migration up failed: %w", err)
	}

	// Get final version
	finalVersion, finalDirty, err := migrator.Version()
	if err == nil {
		m.logger.Info("📊 Final version: %d (dirty: %t)", finalVersion, finalDirty)
	}

	m.logger.Info("✅ Migrations applied successfully")
	return nil
}

// executeScripts executes SQL scripts from a directory.
// Silently skips if directory doesn't exist (scripts are optional).
func (m *migrator) executeScripts(ctx context.Context, migrationsFS fs.FS, scriptPath, scriptType string) error {
	// Check if directory exists
	entries, err := fs.ReadDir(migrationsFS, scriptPath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			m.logger.Info("⏭️  No %s scripts found (optional)", scriptType)
			return nil
		}
		return fmt.Errorf("failed to read %s directory: %w", scriptType, err)
	}

	// Collect SQL files
	var sqlFiles []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".sql") {
			sqlFiles = append(sqlFiles, entry.Name())
		}
	}

	if len(sqlFiles) == 0 {
		m.logger.Info("⏭️  No %s scripts to execute", scriptType)
		return nil
	}

	// Sort for deterministic execution
	sort.Strings(sqlFiles)

	m.logger.Info("🔄 Executing %d %s script(s)...", len(sqlFiles), scriptType)

	// Execute each script
	for _, filename := range sqlFiles {
		m.logger.Info("🔄 Executing %s script: %s", scriptType, filename)

		content, err := fs.ReadFile(migrationsFS, filepath.Join(scriptPath, filename))
		if err != nil {
			return fmt.Errorf("failed to read script %s: %w", filename, err)
		}

		if _, err := m.db.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("failed to execute script %s: %w", filename, err)
		}

		m.logger.Info("✅ Executed: %s", filename)
	}

	m.logger.Info("✅ %s scripts completed", scriptType)
	return nil
}

// Up is a convenience function that creates DB from environment and runs migrations.
func Up(ctx context.Context, migrationsFS fs.FS, opts ...option) error {
	// Create DB from environment variables
	dsn, err := sqldb.NewDSN(sqldb.DriverTypePostgres)
	if err != nil {
		return fmt.Errorf("failed to generate DSN: %w", err)
	}

	db, err := sqldb.Connect(dsn)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer db.Close()

	sqldb.ConfigureDefaultPool(db)
	dbClient := sqldb.NewDBClient(db)

	m, err := New(dbClient, opts...)
	if err != nil {
		return err
	}

	return m.Run(ctx, migrationsFS)
}
