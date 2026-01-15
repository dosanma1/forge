package amqp

import (
	"context"
	"fmt"
	"maps"
	"time"

	amqp091 "github.com/rabbitmq/amqp091-go"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

const defaultProducerTimeout = 5 * time.Second

type (
	MimeType string

	encoder[T any] func(ctx context.Context, v T) ([]byte, error)

	Producer[T any] interface {
		Publish(ctx context.Context, v T, opts ...PublishOpt) error
	}

	publishConfig struct {
		overrideRoutingKey routingKey
	}

	PublishOpt func(*publishConfig)

	producer[T any] struct {
		client
		encoder encoder[T]
		config  producerConfig
	}
)

const (
	MimeTypeJSON MimeType = "application/json"
)

func defaultPublishOpts() []ProducerOption {
	return []ProducerOption{
		ProducerWithMandatory(true),
		ProducerWithImmediate(false),
		ProducerWithHeaders(map[string]any{}),
		ProducerWithContentType(MimeTypeJSON),
		ProducerWithContentEncoding("utf-8"),
		ProducerWithDeliveryMode(amqp091.Persistent),
		ProducerWithPriority(0),
		ProducerWithAppID(""),
		PorducerWithTimeout(defaultProducerTimeout),
	}
}

func NewProducer[T any](
	conn Connection,
	trace tracer.Tracer,
	log logger.Logger,
	exchange *Exchange,
	routingKey routingKey,
	enc encoder[T],
	opts ...ProducerOption,
) (Producer[T], error) {
	cfg := &producerConfig{routingKey: routingKey}
	for _, opt := range append(defaultPublishOpts(), opts...) {
		opt(cfg)
	}

	cli, err := newClient(conn, trace, log, exchange)
	if err != nil {
		return nil, err
	}

	if err := cli.ch.Confirm(false); err != nil {
		return nil, err
	}

	return &producer[T]{
		client:  *cli,
		encoder: enc,
		config:  *cfg,
	}, nil
}

func OverrideRoutingKey(parts ...RoutingKeyPart) PublishOpt {
	return func(p *publishConfig) {
		p.overrideRoutingKey = RoutingKey(parts...)
	}
}

func (p *producer[T]) Publish(ctx context.Context, v T, opts ...PublishOpt) error {
	cfg := &publishConfig{}
	for _, opt := range opts {
		opt(cfg)
	}

	var err error
	var body []byte
	body, err = p.encoder(ctx, v)
	if err != nil {
		return err
	}

	key := p.config.routingKey
	if cfg.overrideRoutingKey.String() != "" {
		key = cfg.overrideRoutingKey
	}

	publishCtx, cancel := context.WithTimeout(ctx, p.config.timeout)
	defer cancel()
	traceCtx, span := p.startTrace(publishCtx, key)
	defer tracer.EndSpan(span, &err)
	headers := maps.Clone(p.config.headers)
	p.tracer.Propagator().Inject(traceCtx, carrier.NewMapStringAnyCarrier(headers))

	var dConfirmation *amqp091.DeferredConfirmation
	p.log.DebugContext(ctx,
		"producer about to publish message on exchange: %q, routingKey: %q, data: %q",
		p.exchange.name, key, string(body),
	)
	dConfirmation, err = p.ch.PublishWithDeferredConfirmWithContext(
		traceCtx,
		p.exchange.name,
		key.String(),
		p.config.mandatory,
		p.config.immediate,
		amqp091.Publishing{
			Headers:         headers,
			ContentType:     string(p.config.contentType),
			ContentEncoding: p.config.contentEncoding,
			DeliveryMode:    p.config.deliveryMode,
			Priority:        p.config.priority,
			AppId:           p.config.appID,
			Body:            body,
		},
	)
	if err != nil {
		return err
	}

	_, err = dConfirmation.WaitContext(traceCtx)
	if err != nil {
		return err
	}
	p.log.DebugContext(ctx,
		"producer published message on exchange: %q, routingKey: %q, data: %q",
		p.exchange.name, key, string(body),
	)

	return nil
}

func (p *producer[T]) startTrace(ctx context.Context, key routingKey) (context.Context, tracer.Span) {
	newCtx, span := p.tracer.Start(
		ctx,
		tracer.WithName(fmt.Sprintf("%s publish", p.exchange.name)),
		tracer.WithSpanKind(tracer.SpanKindProducer),
	)

	span.SetAttributes(
		tracer.NewKeyValue("messaging.system", "rabbitmq"),
		tracer.NewKeyValue("messaging.operation", "publish"),
		tracer.NewKeyValue("net.app.protocol.name", "amqp"),
		tracer.NewKeyValue("net.app.protocol.version", "0.9.1"),
		tracer.NewKeyValue("messaging.destination.name", p.exchange.name),
		tracer.NewKeyValue("messaging.destination.kind", p.exchange.kind.String()),
		tracer.NewKeyValue("messaging.rabbitmq.destination.routing_key", key.String()),
	)

	return newCtx, span
}

type producerConfig struct {
	mandatory       bool
	immediate       bool
	headers         map[string]any
	contentType     MimeType
	contentEncoding string
	deliveryMode    uint8
	priority        uint8
	appID           string
	timeout         time.Duration
	routingKey      routingKey
}

type ProducerOption func(*producerConfig)

func ProducerWithMandatory(mandatory bool) ProducerOption {
	return func(p *producerConfig) {
		p.mandatory = mandatory
	}
}

func ProducerWithImmediate(immediate bool) ProducerOption {
	return func(p *producerConfig) {
		p.immediate = immediate
	}
}

func ProducerWithHeaders(headers map[string]any) ProducerOption {
	return func(p *producerConfig) {
		p.headers = headers
	}
}

func ProducerWithContentType(contentType MimeType) ProducerOption {
	return func(p *producerConfig) {
		p.contentType = contentType
	}
}

func ProducerWithContentEncoding(contentEncoding string) ProducerOption {
	return func(p *producerConfig) {
		p.contentEncoding = contentEncoding
	}
}

func ProducerWithDeliveryMode(deliveryMode uint8) ProducerOption {
	return func(p *producerConfig) {
		p.deliveryMode = deliveryMode
	}
}

func ProducerWithPriority(priority uint8) ProducerOption {
	return func(p *producerConfig) {
		p.priority = priority
	}
}

func ProducerWithAppID(appID string) ProducerOption {
	return func(p *producerConfig) {
		p.appID = appID
	}
}

func PorducerWithTimeout(timeout time.Duration) ProducerOption {
	return func(p *producerConfig) {
		p.timeout = timeout
	}
}
