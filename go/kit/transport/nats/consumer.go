package nats

import (
	"context"
	"encoding/json"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/nats-io/nats.go"
)

type (
	Decoder[T any] func(ctx context.Context, msg *nats.Msg) (T, error)

	Handler[T any] interface {
		Handle(ctx context.Context, event T) error
	}

	HandlerFunc[T any] func(ctx context.Context, event T) error

	Consumer interface {
		Subscribe(ctx context.Context) error
		Unsubscribe(ctx context.Context) error
	}

	consumer[T any] struct {
		conn    Connection
		log     logger.Logger
		decoder Decoder[T]
		handler Handler[T]
		config  consumerConfig
		sub     *nats.Subscription
		js      nats.JetStreamContext
	}
)

func (f HandlerFunc[T]) Handle(ctx context.Context, event T) error {
	return f(ctx, event)
}

func defaultConsumerOpts() []consumerOption {
	return []consumerOption{
		WithQueueGroup(""),
	}
}

func NewConsumer[T any](
	conn Connection,
	log logger.Logger,
	subject string,
	dec Decoder[T],
	handler Handler[T],
	opts ...consumerOption,
) (Consumer, error) {
	cfg := &consumerConfig{subject: subject}
	for _, opt := range append(defaultConsumerOpts(), opts...) {
		opt(cfg)
	}

	c := &consumer[T]{
		conn:    conn,
		log:     log,
		decoder: dec,
		handler: handler,
		config:  *cfg,
	}

	if cfg.jetStream {
		js, err := conn.JetStream()
		if err != nil {
			return nil, err
		}
		c.js = js
	}

	return c, nil
}

func (c *consumer[T]) Subscribe(ctx context.Context) error {
	var err error
	handler := func(msg *nats.Msg) {
		// Create context for the message handling
		// msgCtx, cancel := context.WithTimeout(ctx, 30*time.Second) // TODO: Make configurable
		// defer cancel()
		msgCtx := context.Background()

		var event T
		event, err := c.decoder(msgCtx, msg)
		if err != nil {
			c.log.ErrorContext(msgCtx, "nats:consumer -> error decoding event", "err", err)
			return
		}

		if err := c.handler.Handle(msgCtx, event); err != nil {
			c.log.ErrorContext(msgCtx, "nats:consumer -> error handling event", "err", err)
			// For JetStream, we might want to Nack here if manual ack is enabled
			return
		}

		// Auto-ack for JS if not manual?
		// NATS library handles non-JS auto-ack.
		// For JS, if we use QueueSubscribe, we might need manual ack if configured.
	}

	if c.js != nil {
		// JetStream
		if c.config.queueGroup != "" {
			c.sub, err = c.js.QueueSubscribe(c.config.subject, c.config.queueGroup, handler, c.config.jsOpts...)
		} else {
			c.sub, err = c.js.Subscribe(c.config.subject, handler, c.config.jsOpts...)
		}
	} else {
		// Core NATS
		if c.config.queueGroup != "" {
			c.sub, err = c.conn.Conn().QueueSubscribe(c.config.subject, c.config.queueGroup, handler)
		} else {
			c.sub, err = c.conn.Conn().Subscribe(c.config.subject, handler)
		}
	}

	if err != nil {
		return err
	}

	c.log.InfoContext(ctx, "nats:consumer -> subscribed", "subject", c.config.subject, "queue", c.config.queueGroup, "jetstream", c.config.jetStream)
	return nil
}

func (c *consumer[T]) Unsubscribe(ctx context.Context) error {
	if c.sub != nil {
		return c.sub.Unsubscribe()
	}
	return nil
}

type consumerConfig struct {
	subject    string
	queueGroup string
	jetStream  bool
	jsOpts     []nats.SubOpt
}

type consumerOption func(*consumerConfig)

func WithQueueGroup(group string) consumerOption {
	return func(c *consumerConfig) {
		c.queueGroup = group
	}
}

func WithJetStream(opts ...nats.SubOpt) consumerOption {
	return func(c *consumerConfig) {
		c.jetStream = true
		c.jsOpts = opts
	}
}

// JSONDecoder is a helper for JSON decoding
func JSONDecoder[T any](ctx context.Context, msg *nats.Msg) (T, error) {
	var v T
	err := json.Unmarshal(msg.Data, &v)
	return v, err
}
