package tcp

import (
	"context"
	"fmt"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"go.uber.org/fx"
)

// FxConfig holds optional configuration for the TCP module
type FxConfig struct {
	Controllers []Controller `ignored:"true"`
}

// FxModule creates a TCP server module.
// It requires a tcp.Handler and logger.Logger to be provided in the container.
// Server address should be configured via ServerOption (e.g. using ProvideAddress).
func FxModule(opts ...ServerOption) fx.Option {
	return fx.Module("transport:tcp",
		// Collect all controllers from dependency graph
		fx.Provide(
			fx.Annotate(
				WithControllers,
				fx.ParamTags(`group:"tcpControllers"`),
				fx.ResultTags(`group:"tcp_server_options"`),
			),
		),
		// Provide user-supplied options
		fx.Supply(
			fx.Annotate(
				opts,
				fx.ResultTags(`group:"tcp_server_options,flatten"`),
			),
		),
		// Create and lifecycle-manage the server
		fx.Provide(
			fx.Annotate(
				startServer,
				fx.ParamTags(``, `optional:"true"`, ``, ``, `group:"tcp_server_options"`),
			),
		),
		fx.Invoke(func(*Server) {}),
	)
}

func startServer(
	lc fx.Lifecycle,
	cfg *FxConfig,
	handler Handler,
	monitor monitoring.Monitor,
	opts []ServerOption,
) (*Server, error) {
	// Merge config controllers with options
	if cfg != nil && len(cfg.Controllers) > 0 {
		opts = append(opts, WithControllers(cfg.Controllers...))
	}

	// Append mandatory dependencies as options
	opts = append(opts, WithHandler(handler))

	server, err := NewServer(monitor, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create TCP server: %w", err)
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return server.Start()
		},
		OnStop: func(ctx context.Context) error {
			return server.Stop()
		},
	})

	return server, nil
}
