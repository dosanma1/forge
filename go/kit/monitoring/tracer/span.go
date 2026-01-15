package tracer

import (
	"time"
)

const (
	// Unset is the default status code.
	Unset SpanStatus = 0
	// Error indicates the operation contains an error.
	Error SpanStatus = 1
	// Ok indicates operation has been validated by an Application developers
	// or Operator to have completed successfully, or contain no error.
	Ok SpanStatus = 2
)

// SpanStatus is an 32-bit representation of a status state.
type SpanStatus uint32

type SpanConfiguration struct {
	Name    string
	TraceID ID
	SpanID  ID
	Kind    SpanKind
}

type KeyValue interface {
	Key() string
	Value() any
}

type keyValue struct {
	key   string
	value any
}

func (kv *keyValue) Key() string {
	return kv.key
}

func (kv *keyValue) Value() any {
	return kv.value
}

func NewKeyValue(key string, value any) KeyValue {
	return &keyValue{
		key:   key,
		value: value,
	}
}

//nolint:gocritic // we use a pointer to error so we are abel to defer this function call
func EndSpan(span Span, err *error) {
	if *err != nil {
		span.SetErrorStatus((*err).Error())
	} else {
		span.SetOkStatus("success")
	}
	span.End()
}

type Span interface {
	HasSpanID() bool
	SpanID() ID
	HasTraceID() bool
	TraceID() ID

	AddEvents(events ...Event)
	SetAttributes(kv ...KeyValue)

	SetOkStatus(description string)
	SetErrorStatus(description string)

	Duration() time.Duration

	End()
}
