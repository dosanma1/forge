package grpc

import (
	"context"
	"strconv"
	"strings"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func TracerMiddleware(trace tracer.Tracer) Middleware {
	if trace == nil {
		panic("grpc tracer middleware error")
	}

	return MiddlewareFunc(func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		newCtx := ctx

		if md, ok := metadata.FromIncomingContext(ctx); ok {
			newCtx = trace.Propagator().Extract(ctx, carrier.NewGRPCMetadataTextMapCarrier(md))
		}

		newCtx, span := trace.Start(
			newCtx,
			tracer.WithSpanKind(tracer.SpanKindServer),
		)
		defer trace.End(span)

		service := "<unknown service>"
		parts := strings.Split(info.FullMethod, "/")
		if len(parts) >= 2 { //nolint:gomnd // needed
			service = parts[1]
		}

		method := "<unknown method>"
		if len(parts) >= 3 { //nolint:gomnd // needed
			method = strings.Join(parts[2:], "/")
		}

		span.SetAttributes(
			tracer.NewKeyValue("rpc.system", "grpc"),
			tracer.NewKeyValue("rpc.service", service),
			tracer.NewKeyValue("rpc.method", method),
			// TODO net.*
			// https://linear.app/messagemycustomer/issue/MMC-146/[general]-tracer-improvements
		)

		response, err := handler(newCtx, req)

		if err != nil {
			span.SetErrorStatus(err.Error())
			span.SetAttributes(
				tracer.NewKeyValue("status_code", strconv.Itoa(int(status.Code(err)))),
			)
		} else {
			span.SetOkStatus("")
			span.SetAttributes(
				tracer.NewKeyValue("status_code", 0),
			)
		}

		return response, err
	})
}
