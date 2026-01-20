package nats

import (
	"context"
	"encoding/json"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/nats-io/nats.go"
)

const defaultProducerTimeout = 5 * time.Second

type (
	Encoder[T any] func(ctx context.Context, v T) ([]byte, error)

	Producer[T any] interface {
		Publish(ctx context.Context, v T, opts ...PublishOpt) error
	}

	publishConfig struct {
		subject string
	}

	PublishOpt func(*publishConfig)

	producer[T any] struct {
		conn    Connection
		encoder Encoder[T]
		log     logger.Logger
		config  producerConfig
		js      nats.JetStreamContext
	}
)

func defaultPublishOpts() []ProducerOption {
	return []ProducerOption{
		ProducerWithTimeout(defaultProducerTimeout),
	}
}

func NewProducer[T any](
	conn Connection,
	log logger.Logger,
	subject string,
	enc Encoder[T],
	opts ...ProducerOption,
) (Producer[T], error) {
	cfg := &producerConfig{subject: subject}
	for _, opt := range append(defaultPublishOpts(), opts...) {
		opt(cfg)
	}

	p := &producer[T]{
		conn:    conn,
		encoder: enc,
		log:     log,
		config:  *cfg,
	}

	if cfg.jetStream {
		js, err := conn.JetStream()
		if err != nil {
			return nil, err
		}
		p.js = js
	}

	return p, nil
}

func OverrideSubject(subject string) PublishOpt {
	return func(p *publishConfig) {
		p.subject = subject
	}
}

func (p *producer[T]) Publish(ctx context.Context, v T, opts ...PublishOpt) error {
	cfg := &publishConfig{}
	for _, opt := range opts {
		opt(cfg)
	}

	data, err := p.encoder(ctx, v)
	if err != nil {
		return err
	}

	subject := p.config.subject
	if cfg.subject != "" {
		subject = cfg.subject
	}

	p.log.DebugContext(ctx, "producer publishing message", "subject", subject)

	if p.js != nil {
		// JetStream Publish
		// TODO: Support PublishAsync if needed, for now synchronous for safety
		_, err = p.js.Publish(subject, data)
	} else {
		// Core NATS Publish
		err = p.conn.Conn().Publish(subject, data)
	}

	if err != nil {
		return err
	}

	return nil
}

type producerConfig struct {
	subject   string
	timeout   time.Duration
	jetStream bool
}

type ProducerOption func(*producerConfig)

func ProducerWithTimeout(timeout time.Duration) ProducerOption {
	return func(p *producerConfig) {
		p.timeout = timeout
	}
}

func ProducerWithJetStream() ProducerOption {
	return func(p *producerConfig) {
		p.jetStream = true
	}
}

// JSONEncoder is a helper for JSON encoding
func JSONEncoder[T any](ctx context.Context, v T) ([]byte, error) {
	return json.Marshal(v)
}
