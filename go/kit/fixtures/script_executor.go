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

// ScriptExecutor handles execution of pre/post fixture scripts
type ScriptExecutor struct {
	monitor monitoring.Monitor
	db      *gormcli.DBClient
}

// NewScriptExecutor creates a new script executor
func NewScriptExecutor(monitor monitoring.Monitor, db *gormcli.DBClient) *ScriptExecutor {
	return &ScriptExecutor{
		monitor: monitor,
		db:      db,
	}
}

// ExecuteScripts runs all scripts in the specified directory
func (se *ScriptExecutor) ExecuteScripts(
	ctx context.Context,
	scriptPath string,
	scriptType string,
	cfg *configuration,
) error {
	logger := se.monitor.Logger()

	logger.InfoContext(ctx, "📋 Running %s scripts from: %s", scriptType, scriptPath)

	// Get schema for placeholder replacement
	schema, err := findSchemaWithPrefix(cfg.DBSchema.String())
	if err != nil {
		err = fields.NewWrappedErr("error finding schema for %s scripts: %v", scriptType, err)
		logger.ErrorContext(ctx, "❌ Schema resolution failed: %s", err.Error())
		return err
	}
	logger.DebugContext(ctx, "🔍 Using schema: %s", schema)

	// Check if script directory exists
	files, err := fs.ReadDir(fixturesFS, scriptPath)
	if err != nil {
		logger.InfoContext(ctx, "📁 %s scripts directory '%s' does not exist, skipping", scriptType, scriptPath)
		return nil
	}

	// Filter and sort SQL files
	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}

	if len(sqlFiles) == 0 {
		logger.InfoContext(ctx, "📁 No %s SQL scripts found in '%s', skipping", scriptType, scriptPath)
		return nil
	}

	// Sort files to ensure consistent execution order
	sort.Strings(sqlFiles)

	logger.InfoContext(ctx, "📝 Found %d %s SQL script(s): %v", len(sqlFiles), scriptType, sqlFiles)

	// Execute each script
	for i, fileName := range sqlFiles {
		logger.InfoContext(ctx, "🔄 [%d/%d] Executing %s script: %s", i+1, len(sqlFiles), scriptType, fileName)

		err := se.executeScript(ctx, scriptPath, fileName, schema, cfg)
		if err != nil {
			err = fields.NewWrappedErr("%s script execution failed for %s: %v", scriptType, fileName, err)
			logger.ErrorContext(ctx, "❌ Script execution failed: %s", err.Error())
			return err
		}

		logger.InfoContext(ctx, "✅ [%d/%d] %s script completed: %s", i+1, len(sqlFiles), scriptType, fileName)
	}

	logger.InfoContext(ctx, "🎉 All %s scripts completed successfully (%d files)", scriptType, len(sqlFiles))
	return nil
}

// executeScript runs a single script file
func (se *ScriptExecutor) executeScript(
	ctx context.Context,
	scriptPath string,
	fileName string,
	schema string,
	cfg *configuration,
) error {
	logger := se.monitor.Logger()

	filePath := filepath.Join(scriptPath, fileName)

	// Read script content
	content, err := fs.ReadFile(fixturesFS, filePath)
	if err != nil {
		return fields.NewWrappedErr("failed to read script file %s: %v", filePath, err)
	}

	// Replace schema placeholder
	query := strings.ReplaceAll(string(content), "<insert_schema_name>", schema)

	// Log query preview for debugging
	preview := query
	if len(preview) > 100 {
		preview = preview[:100] + "..."
	}
	logger.DebugContext(ctx, "📜 Query preview: %s", preview)

	// Execute script
	logger.DebugContext(ctx, "⚡ Executing script: %s", fileName)

	if cfg.dryRun {
		logger.InfoContext(ctx, "🔍 DRY RUN: Would execute script %s (%d characters)", fileName, len(query))
		return nil
	}

	// Execute the script
	startTime := time.Now()
	err = se.executeSQL(ctx, query)
	duration := time.Since(startTime)

	if err != nil {
		return fields.NewWrappedErr("SQL execution failed for script %s: %v", fileName, err)
	}

	logger.DebugContext(ctx, "✅ SQL script executed successfully: %s (took %v)", fileName, duration)
	return nil
}

// executeSQL executes a SQL script
func (se *ScriptExecutor) executeSQL(ctx context.Context, query string) error {
	logger := se.monitor.Logger()

	logger.DebugContext(ctx, "🔄 Executing SQL script")
	logger.DebugContext(ctx, "📝 Query length: %d characters", len(query))

	err := se.db.Exec(query).Error
	if err != nil {
		return fmt.Errorf("SQL execution error: %s", err.Error())
	}

	return nil
}
