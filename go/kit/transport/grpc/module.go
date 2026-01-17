package grpc

import (
	"context"
	"fmt"
	"time"

	"github.com/dosanma1/forge/go/kit/auth"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"go.uber.org/fx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// FxConfig holds optional configuration for the gRPC module
type FxConfig struct {
	Controllers []Controller `ignored:"true"`
}

// ============================================================================
// Server Module
// ============================================================================

// FxModule creates an Fx module for a gRPC server with automatic lifecycle management.
// It wires up controllers and middlewares from the dependency graph and starts/stops
// the server automatically using Fx hooks.
//
// Example usage:
//
//	fx.New(
//	    grpc.FxModule(),
//	    grpc.NewFxController(myController),
//	    grpc.NewFxMiddleware(myMiddleware),
//	)
func FxModule(opts ...serverOption) fx.Option {
	return fx.Module("grpc-gateway",
		// Collect all controllers from dependency graph
		fx.Provide(
			fx.Annotate(
				WithControllers,
				fx.ParamTags(`group:"grpcControllers"`),
				fx.ResultTags(`group:"grpcGatewayOptions"`),
			),
		),
		// Collect all middlewares from dependency graph
		fx.Provide(
			fx.Annotate(
				WithMiddlewares,
				fx.ParamTags(`group:"grpcMiddlewares"`),
				fx.ResultTags(`group:"grpcGatewayOptions"`),
			),
		),
		// Provide user-supplied options
		fx.Supply(
			fx.Annotate(
				opts,
				fx.ResultTags(`group:"grpcGatewayOptions,flatten"`),
			),
		),
		// Create and lifecycle-manage the server
		fx.Provide(
			fx.Annotate(
				startServer,
				fx.ParamTags(``, `optional:"true"`, ``, `group:"grpcGatewayOptions"`),
			),
		),
		// Force server creation
		fx.Invoke(func(*Server) {}),
	)
}

// startServer creates and starts the gRPC server with lifecycle hooks
func startServer(
	lc fx.Lifecycle,
	cfg *FxConfig,
	monitor monitoring.Monitor,
	opts []serverOption,
) (*Server, error) {
	// Merge config controllers with options
	if cfg != nil && len(cfg.Controllers) > 0 {
		opts = append(opts, WithControllers(cfg.Controllers...))
	}

	// Create server
	server, err := NewServer(monitor, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC server: %w", err)
	}

	// Register lifecycle hooks
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return startServerAsync(server)
		},
		OnStop: func(ctx context.Context) error {
			server.GracefulStop()
			return nil
		},
	})

	return server, nil
}

// startServerAsync starts the server in a goroutine and checks for startup errors
func startServerAsync(server *Server) error {
	errCh := make(chan error, 1)

	go func() {
		if err := server.Start(); err != nil {
			errCh <- err
		}
	}()

	// Give the server a moment to start or fail
	select {
	case err := <-errCh:
		return fmt.Errorf("gRPC server failed to start: %w", err)
	case <-time.After(100 * time.Millisecond):
		return nil // Server started successfully
	}
}

// NewFxController registers a controller in the Fx dependency graph.
// The controller will be automatically picked up by FxModule.
//
// Example:
//
//	grpc.NewFxController(func() grpc.Controller {
//	    return myController
//	})
func NewFxController(ctrl any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			ctrl,
			fx.ResultTags(`group:"grpcControllers"`),
			fx.As(new(Controller)),
		),
	)
}

// NewFxMiddleware registers a middleware in the Fx dependency graph.
// The middleware will be automatically picked up by FxModule.
//
// Example:
//
//	grpc.NewFxMiddleware(func(logger logger.Logger) grpc.Middleware {
//	    return middleware.Logging(logger)
//	})
func NewFxMiddleware(middleware any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			middleware,
			fx.ResultTags(`group:"grpcMiddlewares"`),
			fx.As(new(Middleware)),
		),
	)
}

// FxAuthenticator provides a gRPC authenticator from the auth package.
// This is a convenience function for common authentication setups.
func FxAuthenticator() fx.Option {
	return fx.Provide(
		fx.Annotate(
			auth.NewGrpcAuthenticator,
			fx.As(new(GRPCAuthenticator)),
		),
	)
}

// ============================================================================
// Client Module
// ============================================================================

// clientConfig holds configuration for creating a gRPC client module
type clientConfig struct {
	url                    string
	grpcOpts               []grpc.DialOption
	extraProviders         []any
	clientName             string
	constructorAnnotations []fx.Annotation
}

// ClientOption configures a gRPC client module
type clientOption func(*clientConfig)

// WithClientDialOptions adds gRPC dial options to the client
func WithClientDialOptions(opts ...grpc.DialOption) clientOption {
	return func(c *clientConfig) {
		c.grpcOpts = append(c.grpcOpts, opts...)
	}
}

// WithClientProviders adds additional providers to the client module
func WithClientProviders(providers ...any) clientOption {
	return func(c *clientConfig) {
		c.extraProviders = append(c.extraProviders, providers...)
	}
}

// WithClientConstructorAnnotations adds Fx annotations to the client constructor
func WithClientConstructorAnnotations(annotations ...fx.Annotation) clientOption {
	return func(c *clientConfig) {
		c.constructorAnnotations = append(c.constructorAnnotations, annotations...)
	}
}

// FxClientModule creates an Fx module for a gRPC client connection.
// It provides a named client connection that can be injected into other components.
//
// Parameters:
//   - name: Module name and client identifier
//   - url: gRPC server URL (e.g., "localhost:50051")
//   - constructor: Function to create the client from a connection
//   - opts: Additional client options
//
// Example:
//
//	grpc.FxClientModule(
//	    "auth",
//	    "localhost:50051",
//	    func(conn *grpc.ClientConn) AuthServiceClient {
//	        return NewAuthServiceClient(conn)
//	    },
//	)
func FxClientModule(name, url string, constructor any, opts ...clientOption) fx.Option {
	// Generate consistent naming
	clientName := fmt.Sprintf("%sGRPCClient", name)
	urlName := fmt.Sprintf("%sGRPCUrl", name)
	optsName := fmt.Sprintf("%sGRPCOpts", name)

	// Build config
	cfg := &clientConfig{
		url:        url,
		clientName: clientName,
		grpcOpts:   []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())},
	}

	for _, opt := range opts {
		opt(cfg)
	}

	return fx.Module(name,
		// Supply URL
		fx.Supply(
			fx.Annotate(url, fx.ResultTags(fmt.Sprintf(`name:%q`, urlName))),
		),
		// Supply dial options
		fx.Supply(
			fx.Annotate(
				cfg.grpcOpts,
				fx.ResultTags(fmt.Sprintf(`group:"%s,flatten"`, optsName)),
			),
		),
		// Provide connection
		fx.Provide(
			fx.Annotate(
				dial,
				fx.ParamTags(
					fmt.Sprintf(`name:%q`, urlName),
					fmt.Sprintf(`group:%q`, optsName),
				),
				fx.ResultTags(fmt.Sprintf(`name:%q`, clientName)),
			),
		),
		// Provide client
		fx.Provide(append(cfg.extraProviders,
			fx.Annotate(
				constructor,
				append(cfg.constructorAnnotations,
					fx.ParamTags(fmt.Sprintf(`name:%q`, clientName)),
				)...,
			),
		)...),
	)
}
