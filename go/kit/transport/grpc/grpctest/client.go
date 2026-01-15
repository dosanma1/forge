package grpctest

import (
	"context"
	"log"
	"net"
	"testing"

	transportgrpc "github.com/dosanma1/forge/go/kit/transport/grpc"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/resolver"
	"google.golang.org/grpc/test/bufconn"
)

const bufferSize = 1024 * 1024

type serverConfig struct {
	clientOptions []grpc.DialOption
}

type serverConfigOption func(*serverConfig)

func WithClientOptions(opts ...grpc.DialOption) serverConfigOption {
	return func(cfg *serverConfig) {
		cfg.clientOptions = append(cfg.clientOptions, opts...)
	}
}

func NewServer(t *testing.T, controller transportgrpc.Controller, opts ...serverConfigOption) *grpc.ClientConn {
	t.Helper()

	cfg := &serverConfig{}
	for _, opt := range opts {
		opt(cfg)
	}

	lis := bufconn.Listen(bufferSize)
	s := grpc.NewServer()
	s.RegisterService(controller.SD(), controller)
	reflection.Register(s)
	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf("Server exited with error: %v", err)
		}
	}()

	resolver.SetDefaultScheme("passthrough")
	dialer := grpc.WithContextDialer(func(ctx context.Context, s string) (net.Conn, error) {
		return lis.Dial()
	})

	cfg.clientOptions = append(
		cfg.clientOptions,
		dialer,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)

	conn, err := grpc.NewClient("", cfg.clientOptions...)
	assert.NoError(t, err)

	t.Cleanup(func() {
		s.Stop()
		err := conn.Close()
		assert.NoError(t, err)
	})

	return conn
}

func ClientWithAuthInterceptor() grpc.DialOption {
	return grpc.WithUnaryInterceptor(func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		// Apply client middleware
		ctx = transportgrpc.ClientAuthMiddleware()(ctx)

		// Call the original invoker with the modified context
		return invoker(ctx, method, req, reply, cc, opts...)
	})
}
