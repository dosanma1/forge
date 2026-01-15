package tracertest

import (
	"context"
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
	"github.com/stretchr/testify/assert"
)

func InjectParentSpanInCtx(t *testing.T, ctx context.Context) (context.Context, *Span) {
	t.Helper()

	parent := NewSpan(
		WithSpanID(NewSpanID()),
		WithTraceID(NewTraceID()),
	)

	return InjectSpan(ctx, parent), parent
}

func assertSpanWithAttrs(t *testing.T, span *Span, kvs ...any) {
	t.Helper()

	for i := 0; i < len(kvs); i += 2 {
		assert.NotEmptyf(t, span.keyValues[kvs[i].(string)], "attr %s should not be empty", kvs[i].(string))
		assert.Equal(t, kvs[i+1], span.keyValues[kvs[i].(string)])
	}
}

type assertSpanConfig struct {
	assertSpanName     string
	assertEnded        bool
	assertNotEnded     bool
	spanKind           tracer.SpanKind
	assertAttrs        []any
	assertIsPropagated bool
	recorder           *Recorder
	carr               carrier.Carrier
	beforeSpanTime     time.Time
	assertStatusOK     bool
	assertStatusErr    error
	assertParent       *Span
}

type AssertSpanOpt func(c *assertSpanConfig)

func SpanName(name string) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertSpanName = name
	}
}

func SpanEnded() AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertEnded = true
	}
}

func SpanNotEnded() AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertNotEnded = true
	}
}

func SpanWithParent(parent *Span) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertParent = parent
	}
}

func SpanStatusOK() AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertStatusOK = true
	}
}

func SpanStatusErr(err error) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertStatusErr = err
	}
}

func SpanStartedAfter(t time.Time) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.beforeSpanTime = t
	}
}

func SpanKind(kind tracer.SpanKind) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.spanKind = kind
	}
}

func PropagatedSuccessfully(recorder *Recorder, carr carrier.Carrier) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertIsPropagated = true
		c.recorder = recorder
		c.carr = carr
	}
}

func SpanAttrs(kvs ...any) AssertSpanOpt {
	return func(c *assertSpanConfig) {
		c.assertAttrs = kvs
	}
}

func AssertSpan(t *testing.T, span *Span, opts ...AssertSpanOpt) {
	t.Helper()

	c := new(assertSpanConfig)
	c.spanKind = tracer.SpanKindUnspecified
	for _, opt := range opts {
		opt(c)
	}

	if c.spanKind != tracer.SpanKindUnspecified {
		assert.Equal(t, c.spanKind, span.Kind())
	}
	if span.HasEnded() {
		assert.True(t, span.Finish().After(span.Start()) || span.Finish().Equal(span.Start()))
	}
	if c.assertNotEnded {
		assert.False(t, span.HasEnded())
	}
	if c.assertEnded {
		assert.True(t, span.HasEnded())
	}
	if len(c.assertSpanName) > 0 {
		assert.Equal(t, c.assertSpanName, span.Name())
	}
	if len(c.assertAttrs) > 0 {
		assertSpanWithAttrs(t, span, c.assertAttrs...)
	}
	if c.assertIsPropagated {
		newCtx := c.recorder.propagator.Extract(context.Background(), c.carr)
		transportedSpan := c.recorder.SpanFromContext(newCtx)
		assert.Equal(t, span.SpanID(), transportedSpan.SpanID())
	}
	if !c.beforeSpanTime.IsZero() {
		assert.True(t, span.Start().After(c.beforeSpanTime))
	}
	if c.assertStatusOK {
		assert.True(t, span.IsStatusOK())
	}
	if c.assertStatusErr != nil {
		assert.Equal(t, true, span.IsStatusError())
		assert.Equal(t, c.assertStatusErr.Error(), span.Status())
	}
	if c.assertParent != nil {
		assert.Equal(t, c.assertParent.SpanID(), span.ParentID())
	}
}
