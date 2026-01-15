package tracer

import (
	"time"
)

func NewParentSpan(traceID, spanID ID) Span {
	return &parentSpan{traceID: traceID, spanID: spanID}
}

type parentSpan struct {
	traceID ID
	spanID  ID
}

func (f parentSpan) HasSpanID() bool {
	return f.spanID.IsValid()
}

func (f parentSpan) SpanID() ID {
	return f.spanID
}

func (f parentSpan) HasTraceID() bool {
	return f.traceID.IsValid()
}

func (f parentSpan) TraceID() ID {
	return f.traceID
}

func (f parentSpan) AddEvents(events ...Event) {}

func (f parentSpan) SetAttributes(kv ...KeyValue) {}

func (f parentSpan) SetOkStatus(description string) {}

func (f parentSpan) SetErrorStatus(description string) {}

func (f parentSpan) Duration() time.Duration { return time.Duration(0) }

func (f parentSpan) End() {}
