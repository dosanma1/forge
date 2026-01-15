package sqldb

import (
	"go.uber.org/fx"
)

func FxModule(driverType DriverType, options ...ConnectionDSNOption) fx.Option {
	return fx.Module("sqldb",
		fx.Provide(
			fx.Annotate(NewDSN, fx.ParamTags("", `group:"dsnOptions"`)),
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
