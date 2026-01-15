package monitoring

import "go.uber.org/fx"

func FxModule() fx.Option {
	return fx.Module(
		"monitoring",
		fx.Provide(fx.Annotate(New, fx.As(new(Monitor)))),
	)
}
