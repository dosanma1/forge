package sqldb

import (
	"github.com/dosanma1/forge/go/kit/persistence"
	"go.uber.org/fx"
)

func FxModule(driverType DriverType, options ...ConnectionDSNOption) fx.Option {
	return fx.Module("sqldb",
		fx.Provide(
			fx.Annotate(NewDSN, fx.ParamTags("", `group:"dsnOptions"`)),
			fx.Annotate(Connect),
			fx.Annotate(NewDBClient),
			fx.Annotate(NewTransactioner, fx.As(new(persistence.Transactioner))),
		),
		fx.Supply(
			driverType,
			fx.Annotate(
				options,
				fx.ResultTags(`group:"dsnOptions,flatten"`),
			),
		),
	)
}
