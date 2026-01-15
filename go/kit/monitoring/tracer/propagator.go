package tracer

import (
	"context"
	"fmt"
	"strings"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

const propagationKey string = "trace"

// Propagator handles span context propagation over the wire.
//
// If, for example you want to use grpc metadata to store and retrieve the span context, you may use:
// For injection on the client
//
//	md := metadata.New(make(map[string]string))
//	tracer.Propagator().Inject(ctx, carrier.NewGRPCMetadataTextMapCarrier(md))
//	newCtx := metadata.NewOutgoingContext(ctx, md)
//
// For extraction on the server
//
//	if md, ok := metadata.FromIncomingContext(ctx); ok {
//		newCtx = trace.Propagator().Extract(ctx, carrier.NewGRPCMetadataTextMapCarrier(md))
//	}
type Propagator interface {
	Extract(ctx context.Context, carrier carrier.Carrier) context.Context
	Inject(ctx context.Context, carrier carrier.Carrier)
}

func DefaultPropagator(trace Tracer) Propagator {
	return &defaultPropagator{
		trace: trace,
	}
}

type defaultPropagator struct {
	trace Tracer
}

func (o *defaultPropagator) Extract(ctx context.Context, carry carrier.Carrier) context.Context {
	s := carry.Get(propagationKey)
	if s == "" {
		return ctx
	}
	parts := strings.Split(s, "-")
	if len(parts) != 2 { //nolint:gomnd // needed
		return ctx
	}
	return o.trace.InjectParent(ctx, parts[0], parts[1])
}

func (o *defaultPropagator) Inject(ctx context.Context, carry carrier.Carrier) {
	span := o.trace.SpanFromContext(ctx)
	s := fmt.Sprintf("%s-%s", span.TraceID().String(), span.SpanID().String())
	carry.Set(propagationKey, s)
}
