// Package tracer describes interfaces for a Tracer and other support elements
package tracer

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/dosanma1/forge/go/kit/fields"
)

type TracerName string

const (
	FieldNameTracer fields.Name = "tracer"
)

const (
	AzAppInsights TracerName = "az_app_insights"
	Jaeger        TracerName = "jaeger"
)

type SpanOption func(configuration *SpanConfiguration)

func WithName(name string) SpanOption {
	return func(configuration *SpanConfiguration) {
		configuration.Name = name
	}
}

func WithSpanKind(kind SpanKind) SpanOption {
	return func(configuration *SpanConfiguration) {
		configuration.Kind = kind
	}
}

type ID interface {
	IsValid() bool
	json.Marshaler
	fmt.Stringer
}

type Tracer interface {
	Propagator() Propagator
	Start(ctx context.Context, opts ...SpanOption) (context.Context, Span)
	InjectParent(ctx context.Context, traceID, spanID string) context.Context
	End(span Span)
	SpanFromContext(ctx context.Context) Span
}
