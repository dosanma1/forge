package migrator

import (
	"embed"
	"errors"
	"flag"
	"time"

	"github.com/kelseyhightower/envconfig"
	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli/gormpg"

	tracermodule "github.com/dosanma1/forge/go/kit/monitoring/tracer/module"
)

const (
	up                            = "up"
	down                          = "down"
	commonPostMigrationScriptPath = "migrations/common-post-migration"
	commonPreMigrationScriptPath  = "migrations/common-pre-migration"
	timeoutBeforeShutdown         = 5 * time.Second
)

var (
	migrationFS                  embed.FS
	errInvalidMigrationDirection = errors.New("invalid migration direction")
)

// Run initializes and runs the migration process with the provided embedded filesystem
func Run(migrationFolder embed.FS) {
	migrationFS = migrationFolder

	// Load configuration
	cfg := &configuration{}
	err := envconfig.Process("", cfg)
	if err != nil {
		panic(fields.NewWrappedErr("load config failed: %v", err))
	}

	// Parse command-line flags
	parseFlags(cfg)

	// Start the application
	app := configureAppModules(cfg)
	app.Run()
}

// parseFlags defines and parses command-line flags
func parseFlags(cfg *configuration) {
	flag.StringVar(&cfg.migrateDirection, "migrate-direction", up, "Specify migration direction (up or down)")
	flag.BoolVar(&cfg.forceExecutionPostMigrationScripts, "force-execution-post-migration-script", false,
		"Force the execution of the post migration scripts. "+
			"If not specified it will only execute if the migration script was executed and a changed occurred. Default: false.")
	flag.BoolVar(&cfg.forceExecutionPreMigrationScripts, "force-execution-pre-migration-script", false,
		"Force the execution of the pre migration scripts.")
	flag.Parse()
}

// configureAppModules sets up the FX application modules
func configureAppModules(cfg *configuration) *fx.App {
	return fx.New(
		logger.FxModule(),
		tracermodule.FxModule(),
		monitoring.FxModule(),
		gormpg.FxModule(),
		fx.Invoke(newMigrationHandler(cfg)),
	)
}
