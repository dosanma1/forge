//nolint:dupl // ...
package appinsights_test

import (
	"context"
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	applicationinsights "github.com/microsoft/ApplicationInsights-Go/appinsights"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/appinsights"
	appinsights_mock "github.com/dosanma1/forge/go/kit/monitoring/tracer/appinsights/mock"
)

type test struct {
	name      string
	opts      []tracer.SpanOption
	attrs     []tracer.KeyValue
	evts      []tracer.Event
	trackFunc func(telemetry applicationinsights.Telemetry)
}

func tester(t *testing.T, tests []test) {
	t.Helper()
	ctrl := gomock.NewController(t)
	client := appinsights_mock.NewMockTelemetryClient(ctrl)
	ctx := context.Background()

	trace, err := appinsights.New("test_service", appinsights.WithTelemetryClient(client), appinsights.WithInstrumentationKey("aaaa"))
	assert.NoError(t, err)

	for _, testcase := range tests {
		t.Run(testcase.name, func(t *testing.T) {
			_, span := trace.Start(ctx, testcase.opts...)

			span.SetAttributes(testcase.attrs...)

			for _, evt := range testcase.evts {
				span.AddEvents(evt)

				client.EXPECT().Track(gomock.Any()).DoAndReturn(testcase.trackFunc)
			}

			client.EXPECT().Track(gomock.Any()).DoAndReturn(testcase.trackFunc)

			trace.End(span)
		})
	}
}

func TestApplicationinsightsTracer_Basic(t *testing.T) {
	ctrl := gomock.NewController(t)
	client := appinsights_mock.NewMockTelemetryClient(ctrl)
	ctx := context.Background()

	trace, err := appinsights.New("test_service", appinsights.WithTelemetryClient(client), appinsights.WithInstrumentationKey("aaaa"))
	assert.NoError(t, err)

	ctx, span := trace.Start(ctx, tracer.WithName("test name"))
	assert.True(t, span.HasSpanID())
	assert.True(t, span.HasTraceID())

	recoveredSpan := trace.SpanFromContext(ctx)
	assert.True(t, recoveredSpan.HasSpanID())
	assert.True(t, recoveredSpan.HasTraceID())
	assert.Equal(t, span.SpanID(), recoveredSpan.SpanID())
	assert.Equal(t, span.TraceID(), recoveredSpan.TraceID())
}

func TestApplicationinsightsKinds(t *testing.T) {
	tests := []test{
		{
			name: "test server",
			opts: []tracer.SpanOption{
				tracer.WithName("test server"),
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test_service", telemetry.GetProperties()[fields.NameService.Merge(fields.NameName).String()])
				assert.Equal(t, "RequestData", telemetry.TelemetryData().BaseType())
				assert.IsType(t, new(applicationinsights.RequestTelemetry), telemetry)

				tel := telemetry.(*applicationinsights.RequestTelemetry)
				assert.Equal(t, "[test_service] test server ", tel.Name)
			},
		},
		{
			name: "test client",
			opts: []tracer.SpanOption{
				tracer.WithName("test client"),
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test_service", telemetry.GetProperties()[fields.NameService.Merge(fields.NameName).String()])
				assert.Equal(t, "RemoteDependencyData", telemetry.TelemetryData().BaseType())
				assert.IsType(t, new(applicationinsights.RemoteDependencyTelemetry), telemetry)

				tel := telemetry.(*applicationinsights.RemoteDependencyTelemetry)
				assert.Equal(t, "[test_service] test client", tel.Name)
			},
		},
		{
			name: "test consumer",
			opts: []tracer.SpanOption{
				tracer.WithName("test consumer"),
				tracer.WithSpanKind(tracer.SpanKindConsumer),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test_service", telemetry.GetProperties()[fields.NameService.Merge(fields.NameName).String()])
				assert.Equal(t, "RequestData", telemetry.TelemetryData().BaseType())
				assert.IsType(t, new(applicationinsights.RequestTelemetry), telemetry)

				tel := telemetry.(*applicationinsights.RequestTelemetry)
				assert.Equal(t, "[test_service] test consumer ", tel.Name)
			},
		},
		{
			name: "test producer",
			opts: []tracer.SpanOption{
				tracer.WithName("test producer"),
				tracer.WithSpanKind(tracer.SpanKindProducer),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test_service", telemetry.GetProperties()[fields.NameService.Merge(fields.NameName).String()])
				assert.Equal(t, "RemoteDependencyData", telemetry.TelemetryData().BaseType())
				assert.IsType(t, new(applicationinsights.RemoteDependencyTelemetry), telemetry)

				tel := telemetry.(*applicationinsights.RemoteDependencyTelemetry)
				assert.Equal(t, "[test_service] test producer", tel.Name)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_HTTPRequestConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Name] Route and Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.route", "/test/route"),
				tracer.NewKeyValue("http.method", "POST"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "/test/route", telemetry.GetProperties()["http.route"])
				assert.Equal(t, "POST", telemetry.GetProperties()["http.method"])
				assert.Equal(t, "[test_service] POST ", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
		{
			name: "[Name] Route",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.route", "/test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] UNKNOWN ", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
		{
			name: "[URI] Scheme, Host and Target",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.scheme", "https"),
				tracer.NewKeyValue("http.host", "localhost"),
				tracer.NewKeyValue("http.target", "/test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "https", telemetry.GetProperties()["http.scheme"])
				assert.Equal(t, "localhost", telemetry.GetProperties()["http.host"])
				assert.Equal(t, "/test/route", telemetry.GetProperties()["http.target"])
				assert.Equal(t, "https://localhost/test/route", telemetry.(*applicationinsights.RequestTelemetry).Url)
			},
		},
		{
			name: "[URI] Scheme and Target",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.scheme", "https"),
				tracer.NewKeyValue("http.target", "/test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "https:///test/route", telemetry.(*applicationinsights.RequestTelemetry).Url)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_GRPCRequestConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Name] System and Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
				tracer.NewKeyValue("rpc.system", "gRPC"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test/route", telemetry.GetProperties()["rpc.method"])
				assert.Equal(t, "gRPC", telemetry.GetProperties()["rpc.system"])
				assert.Equal(t, "[test_service] test/route test_service/test/route", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
		{
			name: "[Name] Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] test/route test_service/test/route", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
		{
			name: "[URI] Method and Service",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
				tracer.NewKeyValue("rpc.service", "TestService"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test/route", telemetry.GetProperties()["rpc.method"])
				assert.Equal(t, "TestService", telemetry.GetProperties()["rpc.service"])
				assert.Equal(t, "TestService/test/route", telemetry.(*applicationinsights.RequestTelemetry).Url)
			},
		},
		{
			name: "[URI] Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test_service/test/route", telemetry.(*applicationinsights.RequestTelemetry).Url)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_ServiceBusRequestConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Name] ID and System",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("messaging.message_id", "1111111"),
				tracer.NewKeyValue("messaging.system", "convo"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "1111111", telemetry.GetProperties()["messaging.message_id"])
				assert.Equal(t, "convo", telemetry.GetProperties()["messaging.system"])
				assert.Equal(t, "[test_service] 1111111 ", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
		{
			name: "[Name] ID",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("messaging.message_id", "1111111"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] 1111111 ", telemetry.(*applicationinsights.RequestTelemetry).Name)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_HTTPDependencyConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Data] Route and Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.route", "/test/route"),
				tracer.NewKeyValue("http.method", "POST"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "/test/route", telemetry.GetProperties()["http.route"])
				assert.Equal(t, "POST", telemetry.GetProperties()["http.method"])
				assert.Equal(t, "[test_service] POST", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
		{
			name: "[Data] Route",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.route", "/test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] UNKNOWN", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
		{
			name: "[Data] URI",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("http.url", "https://localhost/test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "https://localhost/test/route", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_GRPCDependencyConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Data] System and Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
				tracer.NewKeyValue("rpc.system", "gRPC"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "test/route", telemetry.GetProperties()["rpc.method"])
				assert.Equal(t, "gRPC", telemetry.GetProperties()["rpc.system"])
				assert.Equal(t, "[test_service] test/route", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
		{
			name: "[Data] Method",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("rpc.method", "test/route"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] test/route", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_ServiceBusDependencyConventions(t *testing.T) {
	tests := []test{
		{
			name: "[Data] ID and System",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("messaging.message_id", "1111111"),
				tracer.NewKeyValue("messaging.system", "convo"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "1111111", telemetry.GetProperties()["messaging.message_id"])
				assert.Equal(t, "convo", telemetry.GetProperties()["messaging.system"])
				assert.Equal(t, "[test_service] 1111111", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
		{
			name: "[Data] ID",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindClient),
			},
			attrs: []tracer.KeyValue{
				tracer.NewKeyValue("messaging.message_id", "1111111"),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				assert.Equal(t, "[test_service] 1111111", telemetry.(*applicationinsights.RemoteDependencyTelemetry).Data)
			},
		},
	}

	tester(t, tests)
}

func TestApplicationinsightsTracer_Events(t *testing.T) {
	tests := []test{
		{
			name: "Regular event",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			evts: []tracer.Event{
				tracer.NewEvent(
					tracer.EventName("Test Event"),
					tracer.SkipStacktraceEvent(), tracer.Time(time.Now()),
					tracer.WithAttrsEvent("test1", "1"),
				),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				if telemetry.TelemetryData().BaseType() == "EventData" {
					assert.Equal(t, "1", telemetry.GetProperties()["test1"])
					assert.Equal(t, "Test Event", telemetry.(*applicationinsights.EventTelemetry).Name)
				}
			},
		},
		{
			name: "Regular event",
			opts: []tracer.SpanOption{
				tracer.WithSpanKind(tracer.SpanKindServer),
			},
			evts: []tracer.Event{
				tracer.NewEvent(
					tracer.EventName("Test Event With Error"),
					tracer.EventAttachStacktrace(), tracer.Time(time.Now()),
					tracer.WithAttrsEvent("test1", "1"),
				),
			},
			trackFunc: func(telemetry applicationinsights.Telemetry) {
				if telemetry.TelemetryData().BaseType() == "ExceptionData" {
					assert.Equal(t, "1", telemetry.GetProperties()["test1"])
					assert.Error(t, telemetry.(*applicationinsights.ExceptionTelemetry).Error.(error))
					assert.Equal(t, "test error", telemetry.(*applicationinsights.ExceptionTelemetry).Error.(error).Error())
					assert.NotEmpty(t, telemetry.(*applicationinsights.ExceptionTelemetry).Frames)
				}
			},
		},
	}

	tester(t, tests)
}
