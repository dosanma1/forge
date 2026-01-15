// Package grpc have everything needed to build a GRPC gateway
package grpc

import (
	"crypto/tls"
	"net"
	"os"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type serverOption func(*serverConfig)

type serverConfig struct {
	tlsConfig   *tls.Config
	network     string
	address     string
	controllers []Controller
	middlewares []Middleware
}

func defaultServerControllers(monitor monitoring.Monitor) []Controller {
	return []Controller{NewHealthServer(monitor)}
}

func defaultServerMiddlewares(T tracer.Tracer) []Middleware {
	return []Middleware{
		TracerMiddleware(T),
	}
}

func defaultServerOpts(monitor monitoring.Monitor) []serverOption {
	return []serverOption{
		WithControllers(defaultServerControllers(monitor)...),
		WithMiddlewares(defaultServerMiddlewares(monitor.Tracer())...),
		withAddrFromEnv(),
	}
}

// WithTLSConfig sets the TLS configuration of the inner *http.Server
func WithTLSConfig(config *tls.Config) serverOption {
	return func(cfg *serverConfig) {
		cfg.tlsConfig = config
	}
}

// WithNetwork sets the network the inner *grpc.Server will listen to
func WithNetwork(network string) serverOption {
	return func(cfg *serverConfig) {
		cfg.network = network
	}
}

// WithAddress sets the address the inner *grpc.Server will listen to
func WithAddress(address string) serverOption {
	return func(cfg *serverConfig) {
		cfg.address = address
	}
}

func withAddrFromEnv() serverOption {
	return WithAddress(os.Getenv("GRPC_ADDRESS"))
}

// WithMiddlewares adds the provided rest middlewares to the middleware list
func WithMiddlewares(middlewares ...Middleware) serverOption {
	return func(cfg *serverConfig) {
		cfg.middlewares = append(cfg.middlewares, middlewares...)
	}
}

// WithControllers adds the provided rest controllers to the controllers list
func WithControllers(controllers ...Controller) serverOption {
	return func(cfg *serverConfig) {
		cfg.controllers = append(cfg.controllers, controllers...)
	}
}

type server struct {
	grpc.Server
	listener net.Listener
}

func (g *server) Start() error {
	return g.Serve(g.listener)
}

func New(monitor monitoring.Monitor, opts ...serverOption) (*server, error) {
	grpcOpts := make([]grpc.ServerOption, 0)
	cfg := &serverConfig{
		network: "tcp",
		address: ":3009",
	}

	for _, opt := range append(defaultServerOpts(monitor), opts...) {
		opt(cfg)
	}

	var lis net.Listener

	if cfg.tlsConfig == nil {
		var err error
		lis, err = net.Listen(cfg.network, cfg.address)
		if err != nil {
			return nil, err
		}
	} else {
		var err error
		lis, err = tls.Listen(cfg.network, cfg.address, cfg.tlsConfig)
		if err != nil {
			return nil, err
		}
	}

	for _, m := range cfg.middlewares {
		grpcOpts = append(grpcOpts, grpc.UnaryInterceptor(m.Intercept))
	}

	g := &server{
		Server:   *grpc.NewServer(grpcOpts...),
		listener: lis,
	}

	for _, c := range cfg.controllers {
		g.RegisterService(c.SD(), c)
	}
	reflection.Register(&g.Server)

	return g, nil
}
