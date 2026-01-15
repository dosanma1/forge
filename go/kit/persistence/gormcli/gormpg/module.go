package gormpg

import (
	"context"

	"go.uber.org/fx"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

func FxModule(cliOptions ...gormcli.Option) fx.Option {
	return fx.Module(
		"gormpg",
		fx.Provide(func(m monitoring.Monitor) (*gormcli.DBClient, error) {
			uri, err := sqldb.NewDSN(sqldb.DriverTypePostgres)
			if err != nil {
				return nil, err
			}
			return NewClient(uri, m, cliOptions...)
		}),
		fx.Provide(fx.Annotate(gormcli.NewTransactioner, fx.As(new(persistence.Transactioner)))),
		fx.Invoke(initLifecycle),
	)
}

func initLifecycle(lc fx.Lifecycle, db *gormcli.DBClient) error {
	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return db.Close()
		},
	})

	return nil
}
