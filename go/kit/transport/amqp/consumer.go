package amqp

import (
	"context"
	"errors"
	"fmt"
	"time"

	amqp091 "github.com/rabbitmq/amqp091-go"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/retry"
)

const (
	defaultConsumeTimeout = 10 * time.Second
	defaultMaxGoRoutines  = 10
)

type decoder[T any] func(ctx context.Context, body []byte) (T, error)

type Handler[T any] interface {
	Handle(ctx context.Context, event T) error
}

type HandlerFunc[T any] func(ctx context.Context, event T) error

func (f HandlerFunc[T]) Handle(ctx context.Context, event T) error {
	return f(ctx, event)
}

type Consumer interface {
	Subscribe(ctx context.Context, onError func(context.Context, error)) error
	Unsubscribe(ctx context.Context) error
}

type binding struct {
	key    routingKey
	noWait bool
}

type bindingOption func(*binding)

func BindingNoWait(noWait bool) bindingOption {
	return func(b *binding) {
		b.noWait = noWait
	}
}

func bindingKey(key routingKey) bindingOption {
	return func(b *binding) {
		b.key = key
	}
}

func defaultBindingOpts(key routingKey) []bindingOption {
	return []bindingOption{bindingKey(key), BindingNoWait(false)}
}

type consumer[T any] struct {
	client
	queue   *Queue
	binding *binding
	decoder decoder[T]
	config  consumerConfig
	handler Handler[T]

	isSubscribed bool
	deliveriesCh <-chan amqp091.Delivery
	semaphore    chan struct{}
}

func defaultConsumerOpts() []consumerOption {
	return []consumerOption{
		WithConsumerTag(""), // empty string means that the server will generate a unique tag
		WithAutoAck(false),
		WithExclusive(false),
		withNoLocal(false),
		WithNoWait(false),
		WithTimeout(defaultConsumeTimeout),
		WithMaxGoRoutines(defaultMaxGoRoutines),
	}
}

func NewConsumer[T any](
	conn Connection,
	log logger.Logger,
	exchange *Exchange,
	routingKey routingKey,
	queue *Queue,
	dec decoder[T],
	handler Handler[T],
	opts ...consumerOption,
) (*consumer[T], error) {
	cfg := &consumerConfig{}
	for _, opt := range append(defaultConsumerOpts(), opts...) {
		opt(cfg)
	}

	binding := new(binding)
	for _, opt := range append(defaultBindingOpts(routingKey), cfg.bindingOpts...) {
		opt(binding)
	}

	cli, err := newClient(conn, log, exchange)
	if err != nil {
		return nil, err
	}
	if handler == nil {
		panic(errors.New("handler cannot be nil"))
	}

	return newConsumer(cli, binding, queue, dec, handler, cfg)
}

type panicHandler[T any] struct {
	log     logger.Logger
	handler Handler[T]
}

func (ph panicHandler[T]) Handle(ctx context.Context, event T) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = r.(error)
			ph.log.
				ErrorContext(ctx, "amqp:consumer -> panic on consumer: %v", r)
			return
		}
	}()
	err = ph.handler.Handle(ctx, event)
	return
}

func newConsumer[T any](
	cli *client,
	binding *binding,
	queue *Queue,
	dec decoder[T],
	handler Handler[T],
	cfg *consumerConfig,
) (*consumer[T], error) {
	panicHandler := panicHandler[T]{log: cli.log, handler: handler}
	c := &consumer[T]{
		client:    *cli,
		binding:   binding,
		decoder:   dec,
		config:    *cfg,
		queue:     queue,
		handler:   panicHandler,
		semaphore: make(chan struct{}, cfg.maxGoRoutines),
	}

	if err := c.bindRoutingKey(); err != nil {
		return nil, err
	}

	return c, nil
}

func (c *consumer[T]) bindRoutingKey() error {
	_, err := c.ch.QueueDeclare(c.queue.name, c.queue.durable, c.queue.autoDelete, c.queue.exclusive, c.queue.noWait, nil)
	if err != nil {
		return err
	}
	c.log.Debug("queue with name: %q, declared", c.queue.name)

	if err := c.ch.QueueBind(c.queue.name, c.binding.key.String(), c.exchange.name, c.binding.noWait, nil); err != nil {
		return err
	}
	c.log.Debug("consumer bound to queue: %q, routingKey: %q, exchange: %q", c.queue.name, c.binding.key.String(), c.exchange.name)

	return nil
}

func (c *consumer[T]) Subscribe(ctx context.Context, onError func(context.Context, error)) (err error) {
	if onError == nil {
		panic(errors.New("callback cannot be nil"))
	}

	for {
		c.deliveriesCh, err = c.ch.Consume(
			c.queue.name,
			c.config.consumerTag,
			c.config.autoAck,
			c.config.exclusive,
			c.config.noLocal,
			c.config.noWait,
			nil,
		)
		if err != nil {
			return err
		}
		c.isSubscribed = true

		for d := range c.deliveriesCh {
			c.semaphore <- struct{}{}
			go c.consumeWithTimeout(ctx, d, c.handler, onError)
		}

		if !c.isSubscribed {
			break
		}
		err := c.tryReconnect(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (c *consumer[T]) tryReconnect(ctx context.Context) error {
	err := retry.RetryWithContext(ctx, func() error {
		err := c.reconnect()
		if err != nil {
			return err
		}

		if err := c.bindRoutingKey(); err != nil {
			return err
		}

		c.log.DebugContext(ctx, "consumer bound to queue: %q, routingKey: %q, exchange: %q after reconnection", c.queue.name, c.binding.key.String(), c.exchange.name)

		return nil
	},
		retry.WithExponentialPolicy(),
		retry.WithMaxRetries(maxReconnectionAttempts),
		retry.WithInitialInterval(reconnectionDelay),
	)

	return err
}

func (c *consumer[T]) consumeWithTimeout(
	ctx context.Context,
	d amqp091.Delivery,
	handler Handler[T],
	onError func(context.Context, error),
) {
	defer func() { <-c.semaphore }()
	timeoutCtx, cancel := context.WithTimeout(ctx, c.config.timeout)
	defer cancel()
	c.consume(timeoutCtx, d, handler, onError)
}

func handleConsumerError(ctx context.Context, log logger.Logger, d amqp091.Delivery, err error) {
	if err != nil {
		err = d.Nack(false, false)
		if err != nil {
			log.ErrorContext(ctx, "amqp:consumer -> error not acknowledging message: %v", err)
		}
		return
	}

	err = d.Ack(false)
	if err != nil {
		log.ErrorContext(ctx, "amqp:consumer -> error acknowledging message: %v", err)
	}
}

func (c *consumer[T]) consume(
	ctx context.Context,
	d amqp091.Delivery,
	handler Handler[T],
	onError func(context.Context, error),
) {
	var event T
	receiveCtx := ctx

	var err error
	defer func() {
		if r := recover(); r != nil {
			c.log.ErrorContext(ctx, "amqp:consumer -> recovered from panic: %v", r)
			err = fmt.Errorf("panic: %v", r)
		}

		if c.config.autoAck {
			return
		}

		handleConsumerError(receiveCtx, c.log, d, err)
	}()

	if c.config.consumerTag == "" {
		c.config.consumerTag = d.ConsumerTag
	}

	c.log.DebugContext(ctx,
		"amqp:consumer -> new event received on exchange %q, routingKey: %q, data: %q",
		c.exchange.name, c.binding.key.String(), string(d.Body),
	)

	event, err = c.decoder(receiveCtx, d.Body)
	if err != nil {
		c.log.ErrorContext(ctx, "error decoding event: %v", err)
		onError(receiveCtx, err)
		return
	}

	c.log.DebugContext(ctx,
		"amqp:consumer -> decoded event on exchange %q, routingKey: %q, ev: %+v",
		c.exchange.name, c.binding.key, event,
	)
	processCtx := receiveCtx
	if err = handler.Handle(processCtx, event); err != nil {
		c.log.DebugContext(ctx,
			"amqp:consumer -> event could not be processed on exchange %q, routingKey: %q, ev: %+v, err: %q",
			c.exchange.name, c.binding.key.String(), event, err.Error(),
		)
		onError(processCtx, err)
		return
	}

	c.log.DebugContext(ctx,
		"amqp:consumer -> event processed on exchange %q, routingKey: %q, ev: %+v",
		c.exchange.name, c.binding.key.String(), event,
	)
}

func (c *consumer[T]) Unsubscribe(ctx context.Context) error {
	c.isSubscribed = false
	return c.ch.Cancel(c.config.consumerTag, c.config.noWait)
}

type consumerConfig struct {
	bindingOpts []bindingOption

	consumerTag   string
	autoAck       bool
	exclusive     bool
	noLocal       bool
	noWait        bool
	timeout       time.Duration
	maxGoRoutines uint
}

type consumerOption func(*consumerConfig)

func WithBindingOpts(opts ...bindingOption) consumerOption {
	return func(c *consumerConfig) {
		c.bindingOpts = append(c.bindingOpts, opts...)
	}
}

func WithConsumerTag(tag string) consumerOption {
	return func(c *consumerConfig) {
		c.consumerTag = tag
	}
}

func WithAutoAck(autoAck bool) consumerOption {
	return func(c *consumerConfig) {
		c.autoAck = autoAck
	}
}

func WithExclusive(exclusive bool) consumerOption {
	return func(c *consumerConfig) {
		c.exclusive = exclusive
	}
}

func WithTimeout(timeout time.Duration) consumerOption {
	return func(c *consumerConfig) {
		c.timeout = timeout
	}
}

func WithMaxGoRoutines(maxGoRoutines uint) consumerOption {
	return func(c *consumerConfig) {
		c.maxGoRoutines = maxGoRoutines
	}
}

// not supported by rabbitmq so we don't expose it for now
func withNoLocal(noLocal bool) consumerOption {
	return func(c *consumerConfig) {
		c.noLocal = noLocal
	}
}

func WithNoWait(noWait bool) consumerOption {
	return func(c *consumerConfig) {
		c.noWait = noWait
	}
}
