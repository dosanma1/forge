package amqp_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/transport/amqp"
	"github.com/dosanma1/forge/go/kit/transport/amqp/amqptest"
)

func helperNewConnection(t *testing.T) amqp.Connection {
	t.Helper()

	url := amqptest.GetRabbitMQURL(t)
	t.Setenv("AMQP_URL", url)
	conn, err := amqp.NewConnection()
	assert.NoError(t, err)
	assert.NotNil(t, conn)
	return conn
}

func TestNewConnectionWithDefault(t *testing.T) {
	helperNewConnection(t)
}

func TestNewConnectionWithOptions(t *testing.T) {
	url := amqptest.GetRabbitMQURL(t)
	conn, err := amqp.NewConnection(
		amqp.WithConnURL(url),
		amqp.WithVhost("/"),
		amqp.WithMaxChannels(10),
	)
	assert.NoError(t, err)
	assert.NotNil(t, conn)
	assert.Equal(t, "/", conn.Config.Vhost)
	assert.Equal(t, uint16(10), conn.Config.ChannelMax)
}

func TestNewConnectionWithInvalidURL(t *testing.T) {
	conn, err := amqp.NewConnection(amqp.WithConnURL("invalid"))
	assert.Error(t, err)
	assert.Nil(t, conn)
}
