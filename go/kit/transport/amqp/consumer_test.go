package amqp_test

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/transport/amqp"
)

type validHandler struct {
	t   *testing.T
	obj testObject
	wg  *sync.WaitGroup
}

func (h *validHandler) Handle(ctx context.Context, receivedObj testObject) error {
	assert.Equal(h.t, h.obj, receivedObj)
	h.wg.Done()
	return nil
}

type sleepHandler struct {
	t     *testing.T
	sleep time.Duration
	wg    *sync.WaitGroup
}

func (h *sleepHandler) Handle(ctx context.Context, receivedObj testObject) error {
	time.Sleep(h.sleep)
	h.wg.Done()
	return nil
}

func decodeTestObject(ctx context.Context, b []byte) (testObject, error) {
	var obj testObject
	err := json.Unmarshal(b, &obj)
	return obj, err
}

func helperNewConsumer(t *testing.T, conn amqp.Connection, handler amqp.Handler[testObject], opts ...amqp.ConsumerOption) (
	*tracertest.Recorder, amqp.Consumer,
) {
	t.Helper()

	trace := tracertest.NewRecorderTracer()
	log := loggertest.NewStubLogger(t)
	cli, err := amqp.NewConsumer(
		conn,
		trace,
		log,
		amqp.NewExchange("test-exchange", amqp.ExchangeTypeTopic),
		amqp.RoutingKey(amqp.RoutingKeyPart("test-queue"), amqp.RoutingKeyPartMatchAnyWords),
		amqp.NewQueue("consumerName", amqp.QueueName("test-queue")),
		decodeTestObject,
		handler,
		opts...,
	)
	assert.NoError(t, err)
	assert.NotNil(t, cli)
	return trace, cli
}

func Test_consumer_Subscribe_WithProducer(t *testing.T) {
	conn := helperNewConnection(t)
	pRecorder, prod := helperNewProducer(t, conn)

	wg := sync.WaitGroup{}
	tObj := testObject{TestField: "test"}

	handler := &validHandler{
		t:   t,
		obj: tObj,
		wg:  &wg,
	}

	cRecorder, cons := helperNewConsumer(t, conn, handler)

	go cons.Subscribe(t.Context(), func(ctx context.Context, err error) {})

	wg.Add(1)
	err := prod.Publish(t.Context(), tObj)
	assert.NoError(t, err)

	wg.Add(1)
	err = prod.Publish(t.Context(), tObj)
	assert.NoError(t, err)

	wg.Wait()
	err = cons.Unsubscribe(t.Context())
	assert.NoError(t, err)
	assertProducerTrace(t, pRecorder, 2)
	assertConsumerTrace(t, cRecorder, 4, pRecorder.Spans(), nil)
}

type errorHandler struct{}

func (h *errorHandler) Handle(ctx context.Context, receivedObj testObject) error {
	return assert.AnError
}

type panicHandler struct{}

func (h *panicHandler) Handle(ctx context.Context, receivedObj testObject) error {
	panic(fields.NewWrappedErr("test panic in consumer handler"))
}

func Test_consumer_Subscribe_HandlerError(t *testing.T) {
	tests := []struct {
		name    string
		handler amqp.Handler[testObject]
		want    error
	}{
		{
			name:    "handler error",
			handler: &errorHandler{},
			want:    assert.AnError,
		},
		{
			name:    "panic error",
			handler: &panicHandler{},
			want:    fields.NewWrappedErr("test panic in consumer handler"),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			conn := helperNewConnection(t)
			pRecorder, prod := helperNewProducer(t, conn)

			wg := sync.WaitGroup{}
			tObj := testObject{TestField: "test"}

			cRecorder, cons := helperNewConsumer(t, conn, test.handler)

			go cons.Subscribe(t.Context(), func(_ context.Context, err error) {
				wg.Done()
				assert.Equal(t, test.want, err)
			})

			wg.Add(1)
			err := prod.Publish(t.Context(), tObj)
			assert.NoError(t, err)

			wg.Wait()
			err = cons.Unsubscribe(t.Context())
			assert.NoError(t, err)
			assertProducerTrace(t, pRecorder, 1)
			assertConsumerTrace(t, cRecorder, 2, pRecorder.Spans(), test.want)
		})
	}
}

func assertConsumerTrace(
	t *testing.T,
	tRecorder *tracertest.Recorder,
	numSapns int,
	parentSpans []*tracertest.Span,
	err error,
) {
	t.Helper()

	assert.Len(t, tRecorder.Spans(), numSapns)
	for i, span := range tRecorder.Spans() {
		operation := "process"
		if i%2 == 0 {
			operation = "receive"
		}

		statusOpt := tracertest.SpanStatusOK()
		if err != nil && operation == "process" {
			statusOpt = tracertest.SpanStatusErr(err)
		}

		tracertest.AssertSpan(t, span,
			tracertest.SpanEnded(),
			statusOpt,
			tracertest.SpanName(fmt.Sprintf("test-exchange %s", operation)),
			tracertest.SpanAttrs(
				"messaging.system", "rabbitmq",
				"messaging.operation", operation,
				"net.app.protocol.name", "amqp",
				"net.app.protocol.version", "0.9.1",
				"messaging.source.name", "test-exchange",
				"messaging.source.kind", amqp.ExchangeTypeTopic.String(),
			),
			tracertest.SpanWithParent(parentSpans[i/2]),
		)
	}
}

func Test_consumer_Consume_Timeout(t *testing.T) {
	conn := helperNewConnection(t)
	_, prod := helperNewProducer(t, conn)

	wg := sync.WaitGroup{}
	tObj := testObject{TestField: "test"}
	handler := &sleepHandler{
		t:     t,
		sleep: 1 * time.Second,
		wg:    &wg,
	}

	_, cons := helperNewConsumer(t, conn, handler, amqp.ConsumerWithTimeout(10*time.Millisecond))

	go cons.Subscribe(t.Context(), func(_ context.Context, _ error) {})

	wg.Add(1)
	err := prod.Publish(t.Context(), tObj)
	assert.NoError(t, err)

	wg.Wait()
	err = cons.Unsubscribe(t.Context())
	assert.NoError(t, err)
}
