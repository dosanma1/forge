package tracertest

import (
	"time"

	"github.com/google/uuid"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type idOption func(id *idStub)

func idDefaultOpts() []idOption {
	return []idOption{
		WithID(uuid.NewString()),
	}
}

func WithID(idVal string) idOption {
	return func(id *idStub) {
		id.id = idVal
	}
}

type idStub struct {
	id string
}

func NewID(opts ...idOption) tracer.ID {
	id := &idStub{}
	for _, opt := range append(idDefaultOpts(), opts...) {
		opt(id)
	}
	return id
}

func (i idStub) IsValid() bool {
	return i.id != ""
}

func (i idStub) MarshalJSON() ([]byte, error) {
	return []byte(i.id), nil
}

func (i idStub) String() string {
	return i.id
}

type option func(s *Span)

func WithName(name string) func(s *Span) {
	return func(s *Span) {
		s.name = name
	}
}

func WithTraceID(id tracer.ID) func(s *Span) {
	return func(s *Span) {
		s.traceID = id
	}
}

func WithSpanID(id tracer.ID) func(s *Span) {
	return func(s *Span) {
		s.spanID = id
	}
}

func WithParentID(id tracer.ID) func(s *Span) {
	return func(s *Span) {
		s.parentID = id
	}
}

func WithKind(kind tracer.SpanKind) func(s *Span) {
	return func(s *Span) {
		s.kind = kind
	}
}

type Span struct {
	name      string
	kind      tracer.SpanKind
	traceID   tracer.ID
	spanID    tracer.ID
	parentID  tracer.ID
	events    []tracer.Event
	keyValues map[string]any
	ok        bool
	error     bool
	status    string
	start     time.Time
	finish    time.Time
}

func NewSpan(opts ...option) *Span {
	s := &Span{
		traceID:   TraceID{},
		spanID:    SpanID{},
		parentID:  SpanID{},
		keyValues: make(map[string]any),
		start:     time.Now(),
	}

	for _, opt := range opts {
		opt(s)
	}

	return s
}

func (s *Span) HasSpanID() bool {
	return s.spanID.IsValid()
}

func (s *Span) SpanID() tracer.ID {
	return s.spanID
}

func (s *Span) HasTraceID() bool {
	return s.traceID.IsValid()
}

func (s *Span) TraceID() tracer.ID {
	return s.traceID
}

func (s *Span) HasParentID() bool {
	return s.parentID.IsValid()
}

func (s *Span) ParentID() tracer.ID {
	return s.parentID
}

func (s *Span) AddEvents(events ...tracer.Event) {
	s.events = append(s.events, events...)
}

func (s *Span) SetAttributes(kv ...tracer.KeyValue) {
	for _, item := range kv {
		s.keyValues[item.Key()] = item.Value()
	}
}

func (s *Span) SetOkStatus(description string) {
	s.ok = true
	s.error = false
	s.status = description
}

func (s *Span) SetErrorStatus(description string) {
	s.ok = false
	s.error = true
	s.status = description
}

func (s *Span) End() {
	if s.finish.IsZero() {
		s.finish = time.Now().UTC()
	}
}

func (s *Span) Name() string {
	return s.name
}

func (s *Span) Kind() tracer.SpanKind {
	return s.kind
}

func (s *Span) Events() []tracer.Event {
	return s.events
}

func (s *Span) IsStatusOK() bool {
	return s.ok
}

func (s *Span) IsStatusError() bool {
	return s.error
}

func (s *Span) Status() string {
	return s.status
}

func (s *Span) HasEnded() bool {
	return !s.finish.IsZero()
}

func (s *Span) Start() time.Time {
	return s.start
}

func (s *Span) Finish() time.Time {
	return s.finish
}

func (s *Span) Duration() time.Duration {
	return s.Finish().Sub(s.Start())
}

func (s *Span) KeyValue() map[string]any {
	return s.keyValues
}
