package tracer

import (
	"fmt"
	"time"
)

type EventName string

func (n EventName) String() string {
	return string(n)
}

type Option func(ev *event)

func Time(t time.Time) Option {
	return func(ev *event) {
		if !t.IsZero() {
			ev.t = t
		}
	}
}

func attachedStacktrace(val bool) Option {
	return func(ev *event) {
		ev.attachStacktrace = val
	}
}

func WithAttrsEvent(keyVals ...any) Option {
	return func(ev *event) {
		for i := 0; i+1 < len(keyVals); i += 2 {
			key, ok := keyVals[i].(string)
			if !ok {
				fmtKey, keyCast := keyVals[i].(fmt.Stringer)
				if !keyCast || fmtKey == nil {
					continue
				}
				key = fmtKey.String()
			}
			ev.attrs[key] = keyVals[i+1]
		}
	}
}

func EventAttachStacktrace() Option {
	return attachedStacktrace(true)
}

func SkipStacktraceEvent() Option {
	return attachedStacktrace(false)
}

type EventAttrs map[string]any

type event struct {
	name             EventName
	t                time.Time
	attachStacktrace bool
	attrs            EventAttrs
}

func (ev *event) Name() EventName {
	return ev.name
}

func (ev *event) Timestamp() time.Time {
	return ev.t
}

func (ev *event) StackTrace() bool {
	return ev.attachStacktrace
}

func (ev *event) Attributes() EventAttrs {
	return ev.attrs
}

type errEvent struct {
	event
	err error
}

func (errEv *errEvent) Error() string {
	return errEv.err.Error()
}

type ErrEvent interface {
	Event
	error
}

type Event interface {
	Name() EventName
	Timestamp() time.Time
	StackTrace() bool
	Attributes() EventAttrs
}

func defaultOpts() []Option {
	return []Option{
		Time(time.Now().UTC()),
		SkipStacktraceEvent(),
	}
}

func newBaseEvent(name EventName, opts ...Option) *event {
	ev := &event{
		name:  name,
		attrs: make(map[string]any),
	}
	for _, opt := range append(defaultOpts(), opts...) {
		opt(ev)
	}

	return ev
}

func NewEvent(name EventName, opts ...Option) Event {
	return newBaseEvent(name, opts...)
}

func NewFromErr(name EventName, err error, opts ...Option) ErrEvent {
	return &errEvent{
		event: *newBaseEvent(name, opts...),
		err:   err,
	}
}
