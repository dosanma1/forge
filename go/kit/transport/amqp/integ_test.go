//go:build integration
// +build integration

package amqp_test

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/transport/amqp"
	"github.com/dosanma1/forge/go/kit/transport/amqp/amqptest"
)

func TestConsumerSubscribeReconnect(t *testing.T) {
	url := amqptest.GetRabbitMQURL(t)
	t.Setenv("AMQP_URL", url)
	conn, err := amqp.NewConnection()
	assert.NoError(t, err)

	_, prod := helperNewProducer(t, conn)

	wg := sync.WaitGroup{}
	tObj := testObject{TestField: "test"}
	handler := &validHandler{
		t:   t,
		obj: tObj,
		wg:  &wg,
	}
	_, cons := helperNewConsumer(t, conn, handler)

	go cons.Subscribe(t.Context(), func(ctx context.Context, err error) {})

	wg.Add(1)
	err = prod.Publish(t.Context(), tObj)
	assert.NoError(t, err)

	wg.Wait()
	amqptest.RestartRabbitMQ(t)

	for {
		prod, err = amqp.NewProducer(
			conn,
			tracertest.NewRecorderTracer(),
			loggertest.NewStubLogger(t),
			amqp.NewExchange("test-exchange", amqp.ExchangeTypeTopic),
			amqp.RoutingKey(amqp.RoutingKeyPart("test-queue"), amqp.RoutingKeyPart("innerpart"), amqp.RoutingKeyPart("anotherinnerpart")),
			encodeTestObject,
		)
		if err == nil {
			break
		}
		time.Sleep(1 * time.Second)
	}

	wg.Add(1)
	time.Sleep(10 * time.Second)
	err = prod.Publish(t.Context(), tObj)
	assert.NoError(t, err)

	wg.Wait()
	err = cons.Unsubscribe(t.Context())
	assert.NoError(t, err)
}
