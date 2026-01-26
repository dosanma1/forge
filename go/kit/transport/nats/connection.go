package nats

import (
	"os"

	"github.com/nats-io/nats.go"
)

type Connection interface {
	Conn() *nats.Conn
	JetStream(opts ...nats.JSOpt) (nats.JetStreamContext, error)
	Close()
}

type config struct {
	connURL string
	opts    []nats.Option
}

type connOption func(*config)

func WithConnURLFromEnv() connOption {
	addr := os.Getenv("NATS_URL")
	if addr == "" {
		addr = nats.DefaultURL
	}
	return WithConnURL(addr)
}

func WithConnURL(url string) connOption {
	return func(c *config) {
		c.connURL = url
	}
}

func WithNatsOptions(opts ...nats.Option) connOption {
	return func(c *config) {
		c.opts = append(c.opts, opts...)
	}
}

func defaultOpts() []connOption {
	return []connOption{
		WithConnURLFromEnv(),
	}
}

type connection struct {
	nc *nats.Conn
}

func NewConnection(opts ...connOption) (*connection, error) {
	config := &config{}
	for _, opt := range append(defaultOpts(), opts...) {
		opt(config)
	}

	// Default NATS options for resilience
	natsOpts := []nats.Option{
		nats.MaxReconnects(-1),
	}
	natsOpts = append(natsOpts, config.opts...)

	nc, err := nats.Connect(config.connURL, natsOpts...)
	if err != nil {
		return nil, err
	}

	return &connection{nc: nc}, nil
}

func (c *connection) Conn() *nats.Conn {
	return c.nc
}

func (c *connection) JetStream(opts ...nats.JSOpt) (nats.JetStreamContext, error) {
	return c.nc.JetStream(opts...)
}

func (c *connection) Close() {
	if c.nc != nil {
		c.nc.Drain()
		c.nc.Close()
	}
}
