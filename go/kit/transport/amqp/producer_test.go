package amqp_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/transport/amqp"
)

type testObject struct {
	TestField string `json:"test_field"`
}

func encodeTestObject(ctx context.Context, v testObject) ([]byte, error) {
	return json.Marshal(v)
}

func helperNewProducer(t *testing.T, conn amqp.Connection) amqp.Producer[testObject] {
	t.Helper()

	log := loggertest.NewStubLogger(t)
	cli, err := amqp.NewProducer(
		conn,
		log,
		amqp.NewExchange("test-exchange", amqp.ExchangeTypeTopic),
		amqp.RoutingKey(amqp.RoutingKeyPart("test-queue"), amqp.RoutingKeyPart("a"), amqp.RoutingKeyPart("b")),
		encodeTestObject,
	)
	assert.NoError(t, err)
	assert.NotNil(t, cli)
	return cli
}


