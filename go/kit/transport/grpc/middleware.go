package grpc

import (
	"context"

	"google.golang.org/grpc"
)

type MiddlewareFunc grpc.UnaryServerInterceptor

func (f MiddlewareFunc) Intercept(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	return f(ctx, req, info, handler)
}

type Middleware interface {
	Intercept(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error)
}
