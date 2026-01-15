package firebase

import "go.uber.org/fx"

func FxModule() fx.Option {
	return fx.Module(
		"firebase",
		fx.Provide(
			fx.Annotate(NewClient, fx.As(new(Client))),
		),
	)
}
