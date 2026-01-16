package grpc

import (
	"context"
	"fmt"

	"github.com/dosanma1/forge/go/kit/instance"
	"github.com/dosanma1/forge/go/kit/transport"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

type (
	EncodeRequestFunc[I, O any]  func(context.Context, I) (request O, err error)
	DecodeResponseFunc[I, O any] func(context.Context, I) (response O, err error)

	// ClientMiddleware allows modifying the context before making the gRPC call
	ClientMiddleware func(context.Context) context.Context
)

func NewClientEndpoint[EI, EO, DI, DO any](
	client *grpc.ClientConn,
	serviceName grpc.ServiceDesc,
	method string,
	reqEncoder EncodeRequestFunc[EI, EO],
	resDecoder DecodeResponseFunc[DI, DO],
	middlewares ...ClientMiddleware,
) transport.Endpoint[EI, DO] {
	return func(ctx context.Context, request EI) (DO, error) {
		var zero DO
		ctx, cancel := context.WithCancel(ctx)
		defer cancel()

		for _, middleware := range middlewares {
			ctx = middleware(ctx)
		}

		req, err := reqEncoder(ctx, request)
		if err != nil {
			return zero, err
		}

		var header, trailer metadata.MD
		grpcReply := instance.New[DI]()
		if err = client.Invoke(ctx, fmtMethodName(serviceName.ServiceName, method), req, grpcReply, grpc.Header(&header), grpc.Trailer(&trailer)); err != nil {
			return zero, err
		}

		response, err := resDecoder(ctx, grpcReply)
		if err != nil {
			return zero, err
		}
		return response, nil
	}
}

func Call[DO, EI any](ctx context.Context, end transport.Endpoint[EI, DO], req EI) (DO, error) {
	response, err := end(ctx, req)
	if err != nil {
		var result DO
		return result, err
	}
	return response, nil
}

func NewEmptyResClientEndpoint[EI, EO any](
	client *grpc.ClientConn,
	serviceName grpc.ServiceDesc,
	method string,
	reqEncoder EncodeRequestFunc[EI, EO],
	middlewares ...ClientMiddleware,
) transport.EmptyResEndpoint[EI] {
	return func(ctx context.Context, request EI) error {
		ctx, cancel := context.WithCancel(ctx)
		defer cancel()

		// Apply middlewares to modify context (e.g., add metadata)
		for _, middleware := range middlewares {
			ctx = middleware(ctx)
		}

		req, err := reqEncoder(ctx, request)
		if err != nil {
			return err
		}

		var grpcReply interface{}
		if err = client.Invoke(
			ctx, fmtMethodName(serviceName.ServiceName, method), req, grpcReply); err != nil {
			return err
		}

		return nil
	}
}

func CallNoResponse[EI any](ctx context.Context, end transport.EmptyResEndpoint[EI], req EI) error {
	err := end(ctx, req)
	if err != nil {
		return err
	}
	return nil
}

func fmtMethodName(serviceName, method string) string {
	return fmt.Sprintf("/%s/%s", serviceName, method)
}
