package otel

import (
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"

	"go.opentelemetry.io/otel/trace"
)

func spanKind(sk tracer.SpanKind) trace.SpanKind {
	switch sk {
	case tracer.SpanKindInternal:
		return trace.SpanKindInternal
	case tracer.SpanKindServer:
		return trace.SpanKindServer
	case tracer.SpanKindClient:
		return trace.SpanKindClient
	case tracer.SpanKindProducer:
		return trace.SpanKindProducer
	case tracer.SpanKindConsumer:
		return trace.SpanKindConsumer
	case tracer.SpanKindUnspecified:
	}
	return trace.SpanKindUnspecified
}
