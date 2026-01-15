package otel

import (
	"fmt"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

func convertToOtelKeyValSliceAttr(k string, v any) (t *attribute.KeyValue) {
	switch vv := v.(type) {
	case []bool:
		*t = attribute.BoolSlice(k, vv)

	case []int:
		ff := make([]int64, len(vv))
		for i, j := range vv {
			ff[i] = int64(j)
		}
		*t = attribute.Int64Slice(k, ff)
	case []int16:
		ff := make([]int64, len(vv))
		for i, j := range vv {
			ff[i] = int64(j)
		}
		*t = attribute.Int64Slice(k, ff)
	case []int32:
		ff := make([]int64, len(vv))
		for i, j := range vv {
			ff[i] = int64(j)
		}
		*t = attribute.Int64Slice(k, ff)
	case []int64:
		*t = attribute.Int64Slice(k, vv)

	case []float32:
		ff := make([]float64, len(vv))
		for i, j := range vv {
			ff[i] = float64(j)
		}
		*t = attribute.Float64Slice(k, ff)
	case []float64:
		*t = attribute.Float64Slice(k, vv)

	case []string:
		*t = attribute.StringSlice(k, vv)
	}
	return t
}

func convertToOtelAttr(k string, v any) (t *attribute.KeyValue) {
	t = &attribute.KeyValue{}
	switch vv := v.(type) {
	case bool:
		*t = attribute.Bool(k, vv)

	case int:
		*t = attribute.Int64(k, int64(vv))
	case int16:
		*t = attribute.Int64(k, int64(vv))
	case int32:
		*t = attribute.Int64(k, int64(vv))
	case int64:
		*t = attribute.Int64(k, vv)

	case float32:
		*t = attribute.Float64(k, float64(vv))
	case float64:
		*t = attribute.Float64(k, vv)

	case string:
		*t = attribute.String(k, vv)

	case fmt.Stringer:
		*t = attribute.String(k, vv.String())

	default:
		return convertToOtelKeyValSliceAttr(k, v)
	}
	return t
}

func convertOtelKeyValue(v tracer.KeyValue) (t *attribute.KeyValue) {
	return convertToOtelAttr(v.Key(), v.Value())
}

func convertOtelKeyValues(orig []tracer.KeyValue) (kv []attribute.KeyValue) {
	for _, v := range orig {
		t := convertOtelKeyValue(v)
		if t == nil {
			continue
		}
		kv = append(kv, *t)
	}
	return kv
}

func otelKeyValuesFromEventAttrs(orig tracer.EventAttrs) (kv []attribute.KeyValue) {
	for k, v := range orig {
		t := convertToOtelAttr(k, v)
		if t == nil {
			continue
		}
		kv = append(kv, *t)
	}
	return kv
}

type otelSpan struct {
	span trace.Span
}

func (o *otelSpan) HasSpanID() bool {
	return o.span.SpanContext().HasSpanID()
}

func (o *otelSpan) SpanID() tracer.ID {
	return o.span.SpanContext().SpanID()
}

func (o *otelSpan) HasTraceID() bool {
	return o.span.SpanContext().HasTraceID()
}

func (o *otelSpan) TraceID() tracer.ID {
	return o.span.SpanContext().TraceID()
}

func (o *otelSpan) AddEvents(events ...tracer.Event) {
	for _, ev := range events {
		var opts []trace.EventOption
		if len(ev.Attributes()) > 0 {
			opts = append(opts, trace.WithAttributes(otelKeyValuesFromEventAttrs(ev.Attributes())...))
		}
		if ev.StackTrace() {
			opts = append(opts, trace.WithStackTrace(true))
		}
		if !ev.Timestamp().IsZero() {
			opts = append(opts, trace.WithTimestamp(ev.Timestamp()))
		}
		errEvent, isErrEvent := ev.(tracer.ErrEvent)
		if isErrEvent {
			o.span.RecordError(errEvent, opts...)
			o.span.SetStatus(codes.Error, errEvent.Error())
			continue
		}
		o.span.AddEvent(ev.Name().String(), opts...)
	}
}

func (o *otelSpan) SetAttributes(kv ...tracer.KeyValue) {
	o.span.SetAttributes(convertOtelKeyValues(kv)...)
}

func (o *otelSpan) SetOkStatus(description string) {
	o.span.SetStatus(codes.Ok, description)
}

func (o *otelSpan) SetErrorStatus(description string) {
	o.span.SetStatus(codes.Error, description)
}

func (o *otelSpan) Duration() time.Duration {
	return time.Duration(0)
}

func (o *otelSpan) End() {
	o.span.End()
}
