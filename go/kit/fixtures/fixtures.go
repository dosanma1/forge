package fixtures

import (
	"context"
	"embed"
	"flag"
	"time"

	"github.com/kelseyhightower/envconfig"
	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli/gormpg"

	tracermodule "github.com/dosanma1/forge/go/kit/monitoring/tracer/module"
)

const (
	timeoutBeforeShutdown = 5 * time.Second
)

var (
	fixturesFS embed.FS
)

// Run initializes and runs the fixture loading process with the provided embedded filesystem
func Run(fixturesFolder embed.FS) {
	fixturesFS = fixturesFolder
	// Load configuration
	cfg := configuration{}
	err := envconfig.Process("", &cfg)
	if err != nil {
		panic(fields.NewWrappedErr("load config failed: %v", err))
	}

	// Define and parse command-line flags
	flag.BoolVar(&cfg.dryRun, "dry-run", false, "Show what would be executed without running it")
	flag.Parse()

	app := configureAppModules(&cfg)
	app.Run()
}

// configureAppModules sets up the FX application modules
func configureAppModules(cfg *configuration) *fx.App {
	return fx.New(
		logger.FxModule(),
		tracermodule.FxModule(),
		monitoring.FxModule(),
		gormpg.FxModule(),
		fx.Invoke(newFixtureHandler(cfg)),
	)
}

// newFixtureHandler creates an FX handler function
func newFixtureHandler(cfg *configuration) func(
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
		handler := NewFixtureHandler(cfg, monitor, db)

		lc.Append(fx.Hook{
			OnStart: func(appCtx context.Context) error {
				trace := monitor.Tracer()
				ctx, _ := trace.Start(context.Background(), tracer.WithName("fixtures-"+cfg.ServiceName), tracer.WithSpanKind(tracer.SpanKindInternal))

				err := handler.StartFixtureLoading(ctx)

				// Always call exitApp to handle shutdown properly
				go func() {
					handler.exitApp(ctx, shutdowner, err)
				}()

				// Don't return the error to FX, let exitApp handle the exit code
				return nil
			},
			OnStop: func(ctx context.Context) error {
				monitor.Logger().DebugContext(ctx, "Fixtures OnStop")
				return nil
			},
		})
	}
}
