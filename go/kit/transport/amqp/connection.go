package amqp

import (
	"os"
	"time"

	amqp091 "github.com/rabbitmq/amqp091-go"

	"github.com/dosanma1/forge/go/kit/retry"
)

const (
	maxReconnectionAttempts = 5
	reconnectionDelay       = 3 * time.Second
)

type Connection interface {
	Channel() (*amqp091.Channel, error)
	Close() error
}

type config struct {
	connURL     string
	vhost       string
	maxChannels uint16
	properties  amqp091.Table
}

type connOption func(*config)

func WithConnURLFromEnv() connOption {
	return WithConnURL(os.Getenv("AMQP_URL"))
}

func WithConnURL(url string) connOption {
	return func(c *config) {
		c.connURL = url
	}
}

func WithVhost(vhost string) connOption {
	return func(c *config) {
		c.vhost = vhost
	}
}

func WithMaxChannels(maxChannels uint16) connOption {
	return func(c *config) {
		c.maxChannels = maxChannels
	}
}

func WithProperties(properties amqp091.Table) connOption {
	return func(c *config) {
		c.properties = properties
	}
}

func defaultOpts() []connOption {
	return []connOption{
		WithConnURLFromEnv(),
		WithVhost("/"),
		WithMaxChannels(0),
		WithProperties(amqp091.NewConnectionProperties()),
	}
}

func NewConnection(opts ...connOption) (*amqp091.Connection, error) {
	config := &config{}
	for _, opt := range append(defaultOpts(), opts...) {
		opt(config)
	}

	conn, err := amqp091.DialConfig(config.connURL, amqp091.Config{
		Vhost:      config.vhost,
		ChannelMax: config.maxChannels,
		Properties: config.properties,
	})
	if err != nil {
		return nil, err
	}

	go waitForDisconnection(conn, config)
	return conn, nil
}

func waitForDisconnection(conn *amqp091.Connection, cfg *config) {
	ch := conn.NotifyClose(make(chan *amqp091.Error))
	for range ch {
		var connCp *amqp091.Connection
		err := retry.Retry(func() error {
			var dialErr error
			connCp, dialErr = amqp091.DialConfig(cfg.connURL, conn.Config)
			return dialErr
		},
			retry.WithExponentialPolicy(),
			retry.WithMaxRetries(maxReconnectionAttempts),
			retry.WithInitialInterval(reconnectionDelay),
		)

		if err == nil {
			//nolint:govet // only place where conn is reassigned
			*conn = *connCp
		}
		if err != nil {
			panic(err)
		}
	}
}
