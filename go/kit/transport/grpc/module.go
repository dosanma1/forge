package grpc

import (
	"context"
	"fmt"

	"github.com/dosanma1/forge/go/kit/auth"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"go.uber.org/fx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type FxConfig struct {
	Controllers []Controller `ignored:"true"`
}

func FxModule(opts ...serverOption) fx.Option {
	return fx.Module("grpc-gateway",
		fx.Provide(
			fx.Annotate(
				WithControllers,
				fx.ParamTags(`group:"grpcControllers"`),
				fx.ResultTags(`group:"grpcGatewayOptions"`),
			),
		),
		fx.Provide(
			fx.Annotate(
				WithMiddlewares,
				fx.ParamTags(`group:"grpcMiddlewares"`),
				fx.ResultTags(`group:"grpcGatewayOptions"`),
			),
		),
		fx.Supply(
			fx.Annotate(
				opts,
				fx.ResultTags(`group:"grpcGatewayOptions,flatten"`),
			),
		),
		fx.Invoke(
			fx.Annotate(func(lc fx.Lifecycle, cfg *FxConfig, monitor monitoring.Monitor, opts []serverOption) (*server, error) {
				if cfg != nil {
					opts = append(opts,
						WithControllers(cfg.Controllers...),
					)
				}
				g, err := New(monitor, opts...)
				if err != nil {
					return nil, err
				}

				lc.Append(fx.Hook{
					OnStart: func(context.Context) error {
						go func() {
							err := g.Start()
							if err != nil {
								panic(err)
							}
						}()

						return nil
					},
					OnStop: func(ctx context.Context) error {
						g.Stop()
						return nil
					},
				})

				return g, nil
			}, fx.ParamTags(``, `optional:"true"`, ``, `group:"grpcGatewayOptions"`)),
		),
	)
}

func NewFxController(ctrl any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			ctrl,
			fx.ResultTags(`group:"grpcControllers"`),
			fx.As(new(Controller)),
		),
	)
}

func NewFxMiddleware(middleware any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			middleware,
			fx.ResultTags(`group:"grpcMiddlewares"`),
			fx.As(new(Middleware)),
		),
	)
}

func FxAuthenticator() fx.Option {
	return fx.Provide(
		fx.Annotate(auth.NewGrpcAuthenticator, fx.As(new(GRPCAuthenticator))),
	)
}

/// TODO: Review

type clientModConfig struct {
	supplyVals             []any
	providers              []any
	clientName             string
	constructorAnnotations []fx.Annotation
}

type ClientModOpt func(c *clientModConfig)

func ClientWithSupplyVals(vals ...any) ClientModOpt {
	return func(c *clientModConfig) {
		c.supplyVals = append(c.supplyVals, vals...)
	}
}

func ClientWithProviders(providers ...any) ClientModOpt {
	return func(c *clientModConfig) {
		c.providers = append(providers, c.providers...)
	}
}

func ClientWithExtraConstructor(constructor any, annotations ...fx.Annotation) ClientModOpt {
	return func(c *clientModConfig) {
		c.providers = append(
			c.providers,
			fx.Annotate(
				constructor,
				append(annotations, fx.ParamTags(``, fmt.Sprintf(`name:%q`, c.clientName)))...,
			),
		)
	}
}

func ClientWithConstructorAnnotations(annotations ...fx.Annotation) ClientModOpt {
	return func(c *clientModConfig) {
		c.constructorAnnotations = append(c.constructorAnnotations, annotations...)
	}
}

func defaultClientModOpts(
	url, urlName, grpcOptsName, cliName string,
) []ClientModOpt {
	return []ClientModOpt{
		ClientWithConstructorAnnotations(fx.ParamTags(``, fmt.Sprintf(`name:%q`, cliName))),
		ClientWithSupplyVals(
			fx.Annotate(url, fx.ResultTags(fmt.Sprintf(`name:%q`, urlName))),
			fx.Annotate([]grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}, fx.ResultTags(fmt.Sprintf(`group:"%s,flatten"`, grpcOptsName))),
		),
		ClientWithProviders(
			fx.Annotate(dial, fx.ParamTags(fmt.Sprintf(`name:%q`, urlName), fmt.Sprintf(`group:%q`, grpcOptsName)), fx.ResultTags(fmt.Sprintf(`name:%q`, cliName))),
		),
	}
}

func ClientModule(name, connURL string, cliConstructor any, opts ...ClientModOpt) fx.Option {
	var (
		modName      = name
		grpcOptsName = fmt.Sprintf("%s-%s", name, "grpcOpts")
		cliName      = fmt.Sprintf("%sGRPCClient", name)
		urlName      = fmt.Sprintf("%sGRPCUrl", name)
	)
	c := &clientModConfig{
		clientName: cliName,
	}
	for _, opt := range append(
		defaultClientModOpts(
			connURL, urlName, grpcOptsName, cliName,
		), opts...) {
		opt(c)
	}

	return fx.Module(
		modName,
		fx.Supply(c.supplyVals...),
		fx.Provide(
			append(
				c.providers,
				fx.Annotate(
					cliConstructor,
					c.constructorAnnotations...,
				),
			)...,
		),
	)
}
