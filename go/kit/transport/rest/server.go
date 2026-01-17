package rest

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	defTimeout = 10 * time.Second
)

// NewServer creates a new HTTP server with the given options
func NewServer(opts ...serverOption) *http.Server {
	cfg := new(serverConfig)

	for _, opt := range append(defaultServerOpts(), opts...) {
		opt(cfg)
	}

	for _, c := range cfg.controllers {
		for _, e := range c.Endpoints() {

			var version string
			if c.Version() != "" {
				version = "/" + c.Version()
			}

			p := strings.Join([]string{version, c.BasePath(), e.Path()}, "")
			WithEndpoints(NewEndpoint(e.Method(), p, e))(cfg)
		}
	}

	mux := http.NewServeMux()

	for _, e := range cfg.endpoints {
		method := e.Method()
		path := e.Path()
		handler := chain(e, cfg.middlewares...)
		mux.Handle(fmt.Sprintf("%s %s", method, path), handler)
	}

	return &http.Server{
		ReadTimeout:       defTimeout,
		ReadHeaderTimeout: defTimeout,
		WriteTimeout:      defTimeout,
		Addr:              cfg.address,
		Handler:           mux,
		TLSConfig:         cfg.tlsConfig,
	}
}

type serverOption func(*serverConfig)

type serverConfig struct {
	tlsConfig       *tls.Config
	address         string
	grpcAddress     string
	shutdownTimeout time.Duration
	controllers     []Controller
	endpoints       []Endpoint
	middlewares     []Middleware
}

func defaultEndpoints() []Endpoint {
	return []Endpoint{
		NewEndpoint(http.MethodGet, "/healthz", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})),
		NewEndpoint(http.MethodGet, "/healthz/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})),
	}
}

func defaultServerOpts() []serverOption {
	return []serverOption{
		WithEndpoints(defaultEndpoints()...),
		withAddrFromEnv(),
	}
}

// WithTLSConfig sets the TLS configuration of the inner *http.Server
func WithTLSConfig(config *tls.Config) serverOption {
	return func(cfg *serverConfig) {
		cfg.tlsConfig = config
	}
}

// WithAddress sets the address the inner *http.Server will listen to
func WithAddress(address string) serverOption {
	return func(cfg *serverConfig) {
		cfg.address = address
	}
}

func withAddrFromEnv() serverOption {
	return WithAddress(os.Getenv("REST_ADDRESS"))
}

// WithGRPCAddress sets the address the inner *http.Server will listen to
func WithGRPCAddress(grpcAddress string) serverOption {
	return func(cfg *serverConfig) {
		cfg.grpcAddress = grpcAddress
	}
}

// WithShutdownTimeout sets the shutdown deadline
func WithShutdownTimeout(shutdownTimeout time.Duration) serverOption {
	return func(cfg *serverConfig) {
		cfg.shutdownTimeout = shutdownTimeout
	}
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

// WithEndpoints adds the provided endpoints to the endpoint list
func WithEndpoints(endpoints ...Endpoint) serverOption {
	return func(cfg *serverConfig) {
		cfg.endpoints = append(cfg.endpoints, endpoints...)
	}
}
