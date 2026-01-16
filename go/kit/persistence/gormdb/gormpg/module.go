package gormpg

import (
	"context"

	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/gormdb"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

func FxModule(cliOptions ...gormdb.Option) fx.Option {
	return fx.Module(
		"gormpg",
		fx.Provide(func(m monitoring.Monitor) (*gormdb.DBClient, error) {
			uri, err := sqldb.NewDSN(sqldb.DriverTypePostgres)
			if err != nil {
				return nil, err
			}
			return NewClient(uri, m, cliOptions...)
		}),
		fx.Provide(fx.Annotate(gormdb.NewTransactioner, fx.As(new(persistence.Transactioner)))),
		fx.Invoke(initLifecycle),
	)
}

func initLifecycle(lc fx.Lifecycle, db *gormdb.DBClient) error {
	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return db.Close()
		},
	})

	return nil
}
