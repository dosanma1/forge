package rest

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/dosanma1/forge/go/kit/auth"
	"go.uber.org/fx"
)

type FxConfig struct {
	HTTPAddress string `required:"true" envconfig:"HTTP_ADDRESS"`
}

const defaultShutdownTimeout = 5 * time.Second

func FxModule(opts ...serverOption) fx.Option {
	return fx.Module("http-gateway",
		fx.Provide(
			fx.Annotate(
				WithControllers,
				fx.ParamTags(`group:"restControllers"`),
				fx.ResultTags(`group:"restGatewayOptions"`),
			),
		),
		fx.Provide(
			fx.Annotate(
				WithMiddlewares,
				fx.ParamTags(`group:"restMiddlewares"`),
				fx.ResultTags(`group:"restGatewayOptions"`),
			),
		),
		fx.Supply(
			fx.Annotate(
				opts,
				fx.ResultTags(`group:"restGatewayOptions,flatten"`),
			),
		),
		fx.Invoke(
			fx.Annotate(func(lc fx.Lifecycle, opts []serverOption) *http.Server {
				cfg := &serverConfig{
					shutdownTimeout: defaultShutdownTimeout,
				}

				for _, opt := range opts {
					opt(cfg)
				}

				g := New(opts...)

				lc.Append(fx.Hook{
					OnStart: func(context.Context) error {
						go func() {
							err := g.ListenAndServe()
							if !errors.Is(err, http.ErrServerClosed) {
								panic(err)
							}
						}()

						return nil
					},
					OnStop: func(ctx context.Context) error {
						newCtx, cancel := context.WithTimeout(ctx, cfg.shutdownTimeout)
						defer cancel()
						if err := g.Shutdown(newCtx); err != nil {
							return err
						}
						return nil
					},
				})

				return g
			}, fx.ParamTags(``, `group:"restGatewayOptions"`)),
		),
	)
}

// NewFxController is a helper function that given a path and a handler builds a compatible and annotated fx module.
func NewFxController(controller any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			controller,
			fx.ResultTags(`group:"restControllers"`),
			fx.As(new(Controller)),
		),
	)
}

// NewFxMiddleware is a helper function that given a middleware constructor builds a compatible and annotated fx module.
func NewFxMiddleware(middleware any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			middleware,
			fx.ResultTags(`group:"restMiddlewares"`),
			fx.As(new(Middleware)),
		),
	)
}

func FxAuthenticator() fx.Option {
	return fx.Provide(
		fx.Annotate(auth.NewHttpAuthenticator, fx.As(new(HTTPAuthenticator))),
	)
}
