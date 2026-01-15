package migrator

import (
	"context"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
)

// ScriptExecutor handles the execution of pre/post migration scripts
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

// ExecuteScripts executes all SQL scripts in a given directory
func (se *ScriptExecutor) ExecuteScripts(
	ctx context.Context,
	scriptPath string,
	scriptType string,
	cfg *configuration,
) error {
	logger := se.monitor.Logger()

	logger.InfoContext(ctx, fmt.Sprintf("🔄 Executing %s scripts from: %s", scriptType, scriptPath))

	// Read scripts from embedded filesystem using the global migrationFS variable
	entries, err := fs.ReadDir(migrationFS, scriptPath)
	if err != nil {
		// If directory doesn't exist, that's OK - just skip
		logger.InfoContext(ctx, fmt.Sprintf("⏭️  No %s scripts found (directory doesn't exist)", scriptType))
		return nil
	}

	// Filter and sort SQL files
	var sqlFiles []fs.DirEntry
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			sqlFiles = append(sqlFiles, entry)
		}
	}

	if len(sqlFiles) == 0 {
		logger.InfoContext(ctx, fmt.Sprintf("⏭️  No %s scripts found", scriptType))
		return nil
	}

	// Sort files by name to ensure consistent execution order
	sort.Slice(sqlFiles, func(i, j int) bool {
		return sqlFiles[i].Name() < sqlFiles[j].Name()
	})

	logger.InfoContext(ctx, "📋 Found %d %s script(s): %v", len(sqlFiles), scriptType, getFileNames(sqlFiles))

	// Execute each script
	for i, file := range sqlFiles {
		err := se.executeScript(ctx, scriptPath, file.Name(), cfg)
		if err != nil {
			err = fields.NewWrappedErr("%s script '%s' failed: %v", scriptType, file.Name(), err)
			logger.ErrorContext(ctx, "❌ Script failed: %s", err.Error())
			return err
		}
		logger.InfoContext(ctx, "✅ [%d/%d] Script completed: %s", i+1, len(sqlFiles), file.Name())
	}

	logger.InfoContext(ctx, "🎉 All %s scripts completed successfully (%d files)", scriptType, len(sqlFiles))
	return nil
}

// executeScript executes a single script file
func (se *ScriptExecutor) executeScript(
	ctx context.Context,
	scriptPath string,
	fileName string,
	cfg *configuration,
) error {
	logger := se.monitor.Logger()

	filePath := filepath.Join(scriptPath, fileName)

	// Read script content from global migrationFS variable
	content, err := fs.ReadFile(migrationFS, filePath)
	if err != nil {
		return fields.NewWrappedErr("failed to read script file %s: %v", filePath, err)
	}

	// Get schema for placeholder replacement
	schema, err := findSchemaForMigration(cfg.DBSchema.String())
	if err != nil {
		return fields.NewWrappedErr("error finding schema for script: %v", err)
	}

	// Replace schema placeholder
	query := strings.ReplaceAll(string(content), "<insert_schema_name>", schema)

	// Log query preview for debugging
	preview := query
	if len(preview) > 200 {
		preview = preview[:200] + "..."
	}
	logger.DebugContext(ctx, "📜 Script preview: %s", preview)

	// Execute the script
	return se.executeQuery(ctx, query)
}

// executeQuery executes a SQL query
func (se *ScriptExecutor) executeQuery(ctx context.Context, query string) error {
	db := se.db.DB
	if db == nil {
		return fields.NewWrappedErr("database connection is nil")
	}

	err := db.WithContext(ctx).Exec(query).Error
	if err != nil {
		return fields.NewWrappedErr("failed to execute query: %v", err)
	}

	return nil
}

// findSchemaForMigration finds the schema with the specified prefix (separate from fixtures version)
func findSchemaForMigration(schemaNames string) (string, error) {
	prefix := "tb_"
	schemas := strings.Split(schemaNames, ",")
	for _, schema := range schemas {
		trimmedSchema := strings.TrimSpace(schema)
		if strings.HasPrefix(trimmedSchema, prefix) {
			return trimmedSchema, nil
		}
	}
	return "", fmt.Errorf("schema with prefix %s not found", prefix)
}

// getFileNames extracts file names from directory entries
func getFileNames(entries []fs.DirEntry) []string {
	names := make([]string, len(entries))
	for i, entry := range entries {
		names[i] = entry.Name()
	}
	return names
}
