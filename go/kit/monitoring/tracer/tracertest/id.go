// Package tracertest provides a recorder that stores the spans it creates for later inspection.
package tracertest

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type TraceID [16]byte

//nolint:gochecknoglobals // this prevents us from allocating each time we need to check if a TraceID is valid
var nilTraceID = [16]byte{}

func (t TraceID) IsValid() bool {
	return !bytes.Equal(t[:], nilTraceID[:])
}

func (t TraceID) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

func (t TraceID) String() string {
	return hex.EncodeToString(t[:])
}

func NewTraceID() tracer.ID {
	var trace [16]byte
	if _, err := rand.Read(trace[:]); err != nil {
		return TraceID{}
	}
	return TraceID(trace)
}

type SpanID [8]byte

//nolint:gochecknoglobals // this prevents us from allocating each time we need to check if a SpanId is valid
var nilSpanID = [8]byte{}

func (t SpanID) IsValid() bool {
	return !bytes.Equal(t[:], nilSpanID[:])
}

func (t SpanID) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

func (t SpanID) String() string {
	return hex.EncodeToString(t[:])
}

func NewSpanID() tracer.ID {
	var span [8]byte
	if _, err := rand.Read(span[:]); err != nil {
		return SpanID{}
	}
	return SpanID(span)
}
