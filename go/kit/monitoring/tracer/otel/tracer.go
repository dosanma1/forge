package otel

import (
	"context"

	"go.opentelemetry.io/otel"
	"google.golang.org/grpc"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"

	"go.opentelemetry.io/contrib/propagators/b3"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"

	"go.opentelemetry.io/otel/trace"
)

type otelTracer struct {
	propagator tracer.Propagator
	tracer     trace.Tracer
	attributes []tracer.KeyValue
}

type option func(*otelTracer) error

func WithExporter(ctx context.Context, exporter sdktrace.SpanExporter) option {
	return func(t *otelTracer) error {
		tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter))
		defer tp.ForceFlush(ctx)
		otel.SetTracerProvider(tp)
		return nil
	}
}

func WithOTLPGRPCExporter(ctx context.Context, target string, opts ...grpc.DialOption) option {
	return func(t *otelTracer) error {
		conn, err := grpc.NewClient(target, opts...)
		if err != nil {
			return err
		}
		exporter, err := otlptracegrpc.New(ctx,
			otlptracegrpc.WithInsecure(),
			otlptracegrpc.WithGRPCConn(conn))
		if err != nil {
			return err
		}
		tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter))
		defer tp.ForceFlush(ctx)
		otel.SetTracerProvider(tp)
		return nil
	}
}

// WithGlobalAttributes sets initial fields for tracer
func WithGlobalAttributes(kv ...tracer.KeyValue) option {
	return func(cfg *otelTracer) error {
		cfg.attributes = append(cfg.attributes, kv...)
		return nil
	}
}

func WithServiceName(name string) option {
	return WithGlobalAttributes(tracer.NewKeyValue(fields.NameService.Merge(fields.NameName).String(), name))
}

// WithPropagator sets propagator
func WithPropagator(propagator tracer.Propagator) option {
	return func(cfg *otelTracer) error {
		cfg.propagator = propagator
		return nil
	}
}

func defaultOptions(tr tracer.Tracer, serviceName string) []option {
	return []option{
		WithServiceName(serviceName),
		WithPropagator(tracer.DefaultPropagator(tr)),
	}
}

func New(name string, opts ...option) (tracer.Tracer, error) {
	otel.SetTextMapPropagator(b3.New())

	t := &otelTracer{}

	for _, opt := range append(defaultOptions(t, name), opts...) {
		err := opt(t)
		if err != nil {
			return nil, err
		}
	}
	tt := otel.GetTracerProvider().Tracer(name)
	t.tracer = tt

	return t, nil
}

func (o *otelTracer) Propagator() tracer.Propagator {
	return o.propagator
}

func (o *otelTracer) InjectParent(ctx context.Context, t, s string) context.Context {
	tID, err := trace.TraceIDFromHex(t)
	if err != nil {
		return ctx
	}
	sID, err := trace.SpanIDFromHex(s)
	if err != nil {
		return ctx
	}
	scc := trace.SpanContextConfig{
		TraceID: tID,
		SpanID:  sID,
	}
	return trace.ContextWithRemoteSpanContext(ctx, trace.NewSpanContext(scc))
}

func (o *otelTracer) Start(ctx context.Context, opts ...tracer.SpanOption) (context.Context, tracer.Span) {
	cfg := &tracer.SpanConfiguration{
		TraceID: trace.TraceID{},
		SpanID:  trace.SpanID{},
		Name:    "(no name)",
	}
	for _, opt := range opts {
		opt(cfg)
	}
	traceOpt := trace.WithSpanKind(spanKind(cfg.Kind))

	newCtx, s := o.tracer.Start(ctx, cfg.Name, traceOpt)
	span := &otelSpan{
		span: s,
	}

	span.SetAttributes(o.attributes...)
	return newCtx, span
}

func (o *otelTracer) SpanFromContext(ctx context.Context) tracer.Span {
	span := trace.SpanFromContext(ctx)
	return &otelSpan{span: span}
}

func (o *otelTracer) End(span tracer.Span) {
	span.End()
}
