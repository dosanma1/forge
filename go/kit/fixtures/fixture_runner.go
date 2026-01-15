package fixtures

import (
	"context"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
)

// FixtureRunner handles the execution of fixture files
type FixtureRunner struct {
	monitor monitoring.Monitor
	db      *gormcli.DBClient
}

// NewFixtureRunner creates a new fixture runner
func NewFixtureRunner(monitor monitoring.Monitor, db *gormcli.DBClient) *FixtureRunner {
	return &FixtureRunner{
		monitor: monitor,
		db:      db,
	}
}

// LoadFixtures executes the local fixtures.sql file
func (fr *FixtureRunner) LoadFixtures(
	ctx context.Context,
	cfg *configuration,
) error {
	logger := fr.monitor.Logger()

	logger.InfoContext(ctx, fmt.Sprintf("🔧 Initializing fixture loading for service: %s", cfg.ServiceName))

	// Get schema for placeholder replacement
	schema, err := findSchemaWithPrefix(cfg.DBSchema.String())
	if err != nil {
		err = fields.NewWrappedErr("error finding schema for fixtures: %v", err)
		logger.ErrorContext(ctx, fmt.Sprintf("❌ Schema resolution failed: %s", err.Error()))
		return err
	}

	// Load all fixture files from the fixtures directory
	fixturesPath := cfg.fixturesFolder()

	logger.InfoContext(ctx, fmt.Sprintf("📋 Loading fixtures from directory: %s", fixturesPath))

	// Read fixture files from embedded filesystem
	files, err := fs.ReadDir(fixturesFS, fixturesPath)
	if err != nil {
		err = fields.NewWrappedErr("failed to read fixtures directory %s: %v", fixturesPath, err)
		logger.ErrorContext(ctx, "❌ Failed to read fixtures directory: %s", err.Error())
		return err
	}

	// Filter and sort SQL files
	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}

	if len(sqlFiles) == 0 {
		logger.InfoContext(ctx, "� No fixture SQL files found in '%s', skipping", fixturesPath)
		return nil
	}

	// Sort files to ensure consistent execution order
	sort.Strings(sqlFiles)

	logger.InfoContext(ctx, "📝 Found %d fixture SQL file(s): %v", len(sqlFiles), sqlFiles)

	// Execute all fixtures in a single transaction
	logger.InfoContext(ctx, "🔄 Executing all fixtures in a single transaction")
	err = fr.executeFixturesInTransaction(ctx, fixturesPath, sqlFiles, schema, cfg)
	if err != nil {
		err = fields.NewWrappedErr("fixtures loading failed: %v", err)
		logger.ErrorContext(ctx, "❌ Fixtures failed: %s", err.Error())
		return err
	}

	logger.InfoContext(ctx, "🎉 Fixtures loaded successfully")
	return nil
}

// loadFixtureFileContent loads and returns the content of a fixture file with schema replacement
func (fr *FixtureRunner) loadFixtureFileContent(
	ctx context.Context,
	fixtureSetPath string,
	fileName string,
	schema string,
) (string, error) {
	filePath := filepath.Join(fixtureSetPath, fileName)

	// Read fixture content
	content, err := fs.ReadFile(fixturesFS, filePath)
	if err != nil {
		return "", fields.NewWrappedErr("failed to read fixture file %s: %v", filePath, err)
	}

	// Replace schema placeholder
	query := strings.ReplaceAll(string(content), "<insert_schema_name>", schema)

	return query, nil
}

// executeFixturesInTransaction executes all fixture files in a single database transaction
func (fr *FixtureRunner) executeFixturesInTransaction(ctx context.Context, fixturesPath string, sqlFiles []string, schema string, cfg *configuration) error {
	logger := fr.monitor.Logger()

	if cfg.dryRun {
		logger.InfoContext(ctx, "🔍 DRY RUN: Would execute %d fixture files", len(sqlFiles))
		return nil
	}

	// Begin transaction
	tx := fr.db.Begin()
	if tx.Error != nil {
		return fields.NewWrappedErr("failed to begin transaction: %v", tx.Error)
	}

	startTime := time.Now()

	// Execute each fixture file within the transaction
	for i, fileName := range sqlFiles {
		logger.InfoContext(ctx, "🔄 [%d/%d] Executing fixture file: %s", i+1, len(sqlFiles), fileName)

		// Load fixture content
		content, err := fr.loadFixtureFileContent(ctx, fixturesPath, fileName, schema)
		if err != nil {
			// Rollback on error
			if rollbackErr := tx.Rollback().Error; rollbackErr != nil {
				logger.ErrorContext(ctx, "❌ Failed to rollback transaction: %s", rollbackErr.Error())
			}
			return fields.NewWrappedErr("failed to load fixture file %s: %v", fileName, err)
		}

		// Execute the fixture file content
		if execErr := tx.Exec(content).Error; execErr != nil {
			// Rollback on error
			if rollbackErr := tx.Rollback().Error; rollbackErr != nil {
				logger.ErrorContext(ctx, "❌ Failed to rollback transaction: %s", rollbackErr.Error())
			}
			return fields.NewWrappedErr("SQL execution failed for file %s: %v", fileName, execErr)
		}

		logger.InfoContext(ctx, "✅ [%d/%d] Fixture file executed: %s", i+1, len(sqlFiles), fileName)
	}

	// Commit transaction
	if commitErr := tx.Commit().Error; commitErr != nil {
		return fields.NewWrappedErr("failed to commit transaction: %v", commitErr)
	}

	duration := time.Since(startTime)
	logger.InfoContext(ctx, "✅ All %d fixture files executed successfully in transaction (took %v)", len(sqlFiles), duration)
	return nil
}
