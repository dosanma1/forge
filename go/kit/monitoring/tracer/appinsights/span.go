package appinsights

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/microsoft/ApplicationInsights-Go/appinsights/contracts"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"

	"github.com/microsoft/ApplicationInsights-Go/appinsights"
)

func stringValue(v any) string {
	switch vv := v.(type) {
	case json.Marshaler:
		b, _ := vv.MarshalJSON()
		return string(b)
	case fmt.Stringer:
		return vv.String()
	default:
		return fmt.Sprintf("%+v", v)
	}
}

func appinsightsKeyValues(orig []tracer.KeyValue) (kv map[string]string) {
	kv = make(map[string]string)
	for _, v := range orig {
		kv[v.Key()] = stringValue(v.Value())
	}
	return kv
}

func appinsightsKeyValsFromEventAttrs(orig tracer.EventAttrs) (kv map[string]string) {
	kv = make(map[string]string)
	for k, v := range orig {
		kv[k] = stringValue(v)
	}
	return kv
}

type appInEvent struct {
	event tracer.Event
	stack []*contracts.StackFrame
}

type appinsightsSpan struct {
	client     appinsights.TelemetryClient
	traceID    tracer.ID
	spanID     tracer.ID
	parentID   tracer.ID
	name       string
	timestamp  time.Time
	spanKind   tracer.SpanKind
	success    bool
	properties map[string]string
	events     []*appInEvent
}

func (s *appinsightsSpan) HasSpanID() bool {
	return s.spanID.IsValid()
}

func (s *appinsightsSpan) SpanID() tracer.ID {
	return s.spanID
}

func (s *appinsightsSpan) HasTraceID() bool {
	return s.traceID.IsValid()
}

func (s *appinsightsSpan) TraceID() tracer.ID {
	return s.traceID
}

func (s *appinsightsSpan) AddEvents(events ...tracer.Event) {
	for i := range events {
		e := appInEvent{
			event: events[i],
		}
		if e.event.StackTrace() {
			e.stack = appinsights.GetCallstack(1)
		}
		s.events = append(s.events, &e)
	}
}

func (s *appinsightsSpan) SetAttributes(kv ...tracer.KeyValue) {
	for k, v := range appinsightsKeyValues(kv) {
		s.properties[k] = v
	}
}

func (s *appinsightsSpan) SetOkStatus(description string) {
	s.success = true
}

func (s *appinsightsSpan) SetErrorStatus(description string) {
	s.success = false
}

func (s *appinsightsSpan) Duration() time.Duration {
	return time.Since(s.timestamp)
}

func (s *appinsightsSpan) requestSpan() {
	span := appinsights.NewRequestTelemetry(
		spanName(s.name, s.properties),
		spanURI(s.properties),
		time.Since(s.timestamp),
		spanResponseCode(s.properties),
	)

	span.Timestamp = s.timestamp
	span.Source = spanSource(s.properties)
	span.Success = s.success
	span.ResponseCode = spanResponseCode(s.properties)

	span.Properties = s.properties
	span.Id = s.spanID.String()
	span.ContextTags()[contracts.OperationId] = s.traceID.String()

	span.ContextTags()[contracts.OperationParentId] = s.parentID.String()
	if !s.parentID.IsValid() {
		span.ContextTags()[contracts.OperationParentId] = s.traceID.String()
	}
	s.client.Track(span)
}

func (s *appinsightsSpan) dependencySpan() {
	span := appinsights.NewRemoteDependencyTelemetry(spanName(s.name, s.properties), spanType(s.properties), spanTarget(s.properties), s.success)

	span.Timestamp = s.timestamp
	span.Data = spanData(s.name, s.properties)
	span.Duration = time.Since(s.timestamp)
	span.ResultCode = spanResponseCode(s.properties)
	span.Success = s.success

	span.Properties = s.properties
	span.Id = s.spanID.String()
	span.ContextTags()[contracts.OperationId] = s.traceID.String()

	span.ContextTags()[contracts.OperationParentId] = s.parentID.String()
	if !s.parentID.IsValid() {
		span.ContextTags()[contracts.OperationParentId] = s.traceID.String()
	}
	s.client.Track(span)
}

func (s *appinsightsSpan) eventSpans(events []*appInEvent) {
	for _, e := range events {
		errEvent, isErrEvent := e.event.(tracer.ErrEvent)
		if isErrEvent {
			ev := appinsights.NewExceptionTelemetry(errEvent)
			ev.Timestamp = e.event.Timestamp()
			ev.Properties = appinsightsKeyValsFromEventAttrs(e.event.Attributes())
			ev.Frames = e.stack
			ev.ContextTags()[contracts.OperationId] = s.traceID.String()
			ev.ContextTags()[contracts.OperationParentId] = s.spanID.String()
			s.client.Track(ev)
			continue
		}
		ev := appinsights.NewEventTelemetry(e.event.Name().String())
		ev.Timestamp = e.event.Timestamp()
		ev.Properties = appinsightsKeyValsFromEventAttrs(e.event.Attributes())
		ev.ContextTags()[contracts.OperationId] = s.traceID.String()
		ev.ContextTags()[contracts.OperationParentId] = s.spanID.String()
		s.client.Track(ev)
	}
}

func (s *appinsightsSpan) End() {
	if !s.traceID.IsValid() {
		return
	}
	if s.spanKind == tracer.SpanKindConsumer || s.spanKind == tracer.SpanKindServer {
		s.requestSpan()
	} else {
		s.dependencySpan()
	}

	s.eventSpans(s.events)
}
