package rest

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"reflect"
	"strings"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/swaggest/openapi-go/openapi3"
)

const (
	defAddress = ":8080"
	defTimeout = 10 * time.Second
)

func New(t tracer.Tracer, opts ...serverOption) *http.Server {
	cfg := new(serverConfig)

	for _, opt := range append(defaultServerOpts(t), opts...) {
		opt(cfg)
	}

	for _, c := range cfg.controllers {
		for _, e := range c.Endpoints() {

			var version string
			if c.Version() != "" {
				version = "/" + c.Version()
			}

			// p := path.Join(version, c.BasePath(), e.Path())
			p := strings.Join([]string{version, c.BasePath(), e.Path()}, "")
			WithEndpoints(NewEndpoint(e.Method(), p, e))(cfg)
		}
	}

	mux := http.NewServeMux()

	for _, e := range cfg.endpoints {
		method := e.Method()
		path := e.Path()
		handler := chain(e, cfg.middlewares...)

		// var (
		// 	openAPIPreparer OpenAPIPreparer
		// 	preparer        preparerFunc
		// )

		// if handlerAs(e, &openAPIPreparer) {
		// 	preparer = openAPIPreparer.SetupOpenAPIOperation
		// } else if cfg.openapiCollector.OperationExtractor != nil {
		// 	preparer = cfg.openapiCollector.OperationExtractor(handler)
		// }

		// if preparer != nil {
		// 	if err := cfg.openapiCollector.CollectOperation(method, path, cfg.openapiCollector.collect(method, path, preparer)); err != nil {
		// 		panic(err)
		// 	}
		// }

		mux.Handle(fmt.Sprintf("%s %s", method, path), handler)
		// mux.Handle(fmt.Sprintf("%s %s", e.Method(), strings.TrimSuffix(e.Path(), "/")), chain(e, cfg.middlewares...))
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
	tlsConfig        *tls.Config
	address          string
	grpcAddress      string
	shutdownTimeout  time.Duration
	controllers      []Controller
	endpoints        []Endpoint
	middlewares      []Middleware
	openapiCollector *Collector
}

func defaultEndpoints() []Endpoint {
	return []Endpoint{NewHealthEndpoint()}
}

func defaultMiddlewares(trace tracer.Tracer) []Middleware {
	return []Middleware{
		RESTTraceMiddleware(trace),
	}
}

func defaultServerOpts(trace tracer.Tracer) []serverOption {
	return []serverOption{
		WithEndpoints(defaultEndpoints()...),
		WithMiddlewares(defaultMiddlewares(trace)...),
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

func withGRPCAddrFromEnv() serverOption {
	return WithGRPCAddress(os.Getenv("GRPC_ADDRESS"))
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

func WithOpenApiCollector(collector *Collector) serverOption {
	return func(cfg *serverConfig) {
		cfg.openapiCollector = collector
	}
}

func WithDocs(path string, opts ...DocsOption) serverOption {
	return func(cfg *serverConfig) {
		if cfg.openapiCollector == nil {
			cfg.openapiCollector = NewCollector(openapi3.NewReflector())
		}
		path = strings.TrimRight(path, "/")
		cfg.controllers = append(cfg.controllers, NewDocsRESTCtrl(newDocs(path, opts...), cfg.openapiCollector))
	}
}

func handlerAs(handler http.Handler, target interface{}) bool {
	if target == nil {
		panic("target cannot be nil")
	}

	val := reflect.ValueOf(target)
	typ := val.Type()

	if typ.Kind() != reflect.Ptr || val.IsNil() {
		panic("target must be a non-nil pointer")
	}

	handlerType := reflect.TypeOf((*http.Handler)(nil)).Elem()

	if e := typ.Elem(); e.Kind() != reflect.Interface && !e.Implements(handlerType) {
		panic("*target must be interface or implement http.Handler")
	}

	targetType := typ.Elem()
	for {
		endpoint, isEndpoint := handler.(*endpoint)

		if isEndpoint {
			handler = endpoint.Handler
		}

		if handler == nil {
			break
		}

		if reflect.TypeOf(handler).AssignableTo(targetType) {
			val.Elem().Set(reflect.ValueOf(handler))

			return true
		}

		if !isEndpoint {
			break
		}

		handler = endpoint.Handler
	}

	return false
}
