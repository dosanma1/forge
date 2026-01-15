package amqp_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/transport/amqp"
)

type testObject struct {
	TestField string `json:"test_field"`
}

func encodeTestObject(ctx context.Context, v testObject) ([]byte, error) {
	return json.Marshal(v)
}

func helperNewProducer(t *testing.T, conn amqp.Connection) (
	*tracertest.Recorder,
	amqp.Producer[testObject],
) {
	t.Helper()

	trace := tracertest.NewRecorderTracer()
	log := loggertest.NewStubLogger(t)
	cli, err := amqp.NewProducer(
		conn,
		trace,
		log,
		amqp.NewExchange("test-exchange", amqp.ExchangeTypeTopic),
		amqp.RoutingKey(amqp.RoutingKeyPart("test-queue"), amqp.RoutingKeyPart("a"), amqp.RoutingKeyPart("b")),
		encodeTestObject,
	)
	assert.NoError(t, err)
	assert.NotNil(t, cli)
	return trace, cli
}

func assertProducerTrace(t *testing.T, tRecorder *tracertest.Recorder, numSpans int) {
	t.Helper()

	assert.Len(t, tRecorder.Spans(), numSpans)
	for _, span := range tRecorder.Spans() {
		tracertest.AssertSpan(t, span,
			tracertest.SpanEnded(),
			tracertest.SpanStatusOK(),
			tracertest.SpanName("test-exchange publish"),
			tracertest.SpanAttrs(
				"messaging.system", "rabbitmq",
				"messaging.operation", "publish",
				"net.app.protocol.name", "amqp",
				"net.app.protocol.version", "0.9.1",
				"messaging.destination.name", "test-exchange",
				"messaging.destination.kind", amqp.ExchangeTypeTopic.String(),
				"messaging.rabbitmq.destination.routing_key",
				amqp.RoutingKey(amqp.RoutingKeyPart("test-queue"), amqp.RoutingKeyPart("a"), amqp.RoutingKeyPart("b")).String(),
			),
		)
	}
}
