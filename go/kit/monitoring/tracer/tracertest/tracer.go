package tracertest

import (
	"context"
	"encoding/hex"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type contextKeyType string

const contextKey contextKeyType = "recorder-span"

type Recorder struct {
	spans      []*Span
	propagator tracer.Propagator
}

func NewRecorderTracer() *Recorder {
	r := &Recorder{}
	r.propagator = tracer.DefaultPropagator(r)
	return r
}

func (r *Recorder) Propagator() tracer.Propagator {
	return r.propagator
}

func (r *Recorder) Start(ctx context.Context, opts ...tracer.SpanOption) (context.Context, tracer.Span) {
	tID := NewTraceID()
	sID := NewSpanID()
	var parentID tracer.ID
	parentID = SpanID{}

	parent := r.SpanFromContext(ctx)

	if parent.HasTraceID() {
		tID = parent.TraceID()
	}

	if parent.HasSpanID() {
		parentID = parent.SpanID()
	}

	spanConfiguration := &tracer.SpanConfiguration{
		Name:    "",
		TraceID: tID,
		SpanID:  sID,
		Kind:    tracer.SpanKindUnspecified,
	}

	for _, opt := range opts {
		opt(spanConfiguration)
	}

	s := NewSpan(
		WithName(spanConfiguration.Name),
		WithTraceID(spanConfiguration.TraceID),
		WithSpanID(spanConfiguration.SpanID),
		WithParentID(parentID),
		WithKind(spanConfiguration.Kind),
	)

	r.spans = append(r.spans, s)

	return context.WithValue(ctx, contextKey, s), s
}

func (r *Recorder) End(span tracer.Span) {
	span.End()
}

func (r *Recorder) SpanFromContext(ctx context.Context) tracer.Span {
	spanCtx := ctx.Value(contextKey)
	if spanCtx != nil {
		if span, ok := spanCtx.(tracer.Span); ok {
			return span
		}
	}
	return NewSpan()
}

func (r *Recorder) InjectParent(ctx context.Context, t, s string) context.Context {
	tID, err := hex.DecodeString(t)
	if err != nil {
		return ctx
	}
	sID, err := hex.DecodeString(s)
	if err != nil {
		return ctx
	}
	var ttID TraceID
	var ssID SpanID
	copy(ttID[:], tID)
	copy(ssID[:], sID)
	return context.WithValue(ctx, contextKey, tracer.NewParentSpan(ttID, ssID))
}

func (r *Recorder) Spans() []*Span {
	return r.spans
}
