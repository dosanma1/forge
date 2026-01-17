// Package grpc provides everything needed to build a gRPC server and client
package grpc

import (
	"crypto/tls"
	"net"
	"os"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"google.golang.org/grpc"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/reflection"
)

type serverOption func(*serverConfig)

type serverConfig struct {
	tlsConfig   *tls.Config
	network     string
	address     string
	controllers []Controller
	middlewares []Middleware
	keepalive   *keepalive.ServerParameters
}

func defaultServerControllers(monitor monitoring.Monitor) []Controller {
	return []Controller{NewHealthServer(monitor)}
}

func defaultServerMiddlewares() []Middleware {
	return []Middleware{}
}

func defaultKeepalive() *keepalive.ServerParameters {
	return &keepalive.ServerParameters{
		MaxConnectionIdle: 15 * time.Second, // Close idle connections after 15s
		Time:              5 * time.Second,  // Ping interval
		Timeout:           1 * time.Second,  // Ping timeout
	}
}

func defaultServerOpts(monitor monitoring.Monitor) []serverOption {
	return []serverOption{
		WithControllers(defaultServerControllers(monitor)...),
		WithMiddlewares(defaultServerMiddlewares()...),
		WithKeepalive(defaultKeepalive()),
		withAddrFromEnv(),
	}
}

// WithTLSConfig sets the TLS configuration for the server
func WithTLSConfig(config *tls.Config) serverOption {
	return func(cfg *serverConfig) {
		cfg.tlsConfig = config
	}
}

// WithNetwork sets the network the server will listen to (tcp, tcp4, tcp6, unix)
func WithNetwork(network string) serverOption {
	return func(cfg *serverConfig) {
		cfg.network = network
	}
}

// WithAddress sets the address the server will listen to (e.g., ":50051", "localhost:50051")
func WithAddress(address string) serverOption {
	return func(cfg *serverConfig) {
		cfg.address = address
	}
}

// WithKeepalive sets keepalive parameters to prevent zombie connections
func WithKeepalive(params *keepalive.ServerParameters) serverOption {
	return func(cfg *serverConfig) {
		cfg.keepalive = params
	}
}

func withAddrFromEnv() serverOption {
	addr := os.Getenv("GRPC_ADDRESS")
	if addr == "" {
		return func(cfg *serverConfig) {} // No-op if env var not set
	}
	return WithAddress(addr)
}

// WithMiddlewares adds the provided middlewares to the middleware list
func WithMiddlewares(middlewares ...Middleware) serverOption {
	return func(cfg *serverConfig) {
		cfg.middlewares = append(cfg.middlewares, middlewares...)
	}
}

// WithControllers adds the provided controllers to the controllers list
func WithControllers(controllers ...Controller) serverOption {
	return func(cfg *serverConfig) {
		cfg.controllers = append(cfg.controllers, controllers...)
	}
}

// Server wraps grpc.Server with additional functionality
type Server struct {
	*grpc.Server // Embedded as pointer (not value)
	listener     net.Listener
}

// Start starts serving gRPC requests
func (s *Server) Start() error {
	return s.Serve(s.listener)
}

// Addr returns the listener's network address
func (s *Server) Addr() net.Addr {
	if s.listener != nil {
		return s.listener.Addr()
	}
	return nil
}

// NewServer creates a new gRPC server with the given options
func NewServer(monitor monitoring.Monitor, opts ...serverOption) (*Server, error) {
	grpcOpts := make([]grpc.ServerOption, 0)
	cfg := &serverConfig{
		network: "tcp",
		address: ":50051", // gRPC standard port
	}

	for _, opt := range append(defaultServerOpts(monitor), opts...) {
		opt(cfg)
	}

	// Add keepalive if configured
	if cfg.keepalive != nil {
		grpcOpts = append(grpcOpts, grpc.KeepaliveParams(*cfg.keepalive))
	}

	// Setup listener
	var lis net.Listener
	var err error

	if cfg.tlsConfig == nil {
		lis, err = net.Listen(cfg.network, cfg.address)
		if err != nil {
			return nil, err
		}
	} else {
		lis, err = tls.Listen(cfg.network, cfg.address, cfg.tlsConfig)
		if err != nil {
			return nil, err
		}
	}

	// Chain middlewares
	if len(cfg.middlewares) > 0 {
		grpcOpts = append(grpcOpts, grpc.UnaryInterceptor(ChainUnaryServer(cfg.middlewares...)))
	}

	s := &Server{
		Server:   grpc.NewServer(grpcOpts...),
		listener: lis,
	}

	// Register controllers
	for _, c := range cfg.controllers {
		s.RegisterService(c.SD(), c)
	}

	// Enable reflection for debugging
	reflection.Register(s.Server)

	return s, nil
}
