package amqp

import (
	"errors"
	"strings"

	amqp091 "github.com/rabbitmq/amqp091-go"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/slicesx"
)

type ExchangeType string

const (
	ExchangeTypeDirect  ExchangeType = "direct"
	ExchangeTypeFanout  ExchangeType = "fanout"
	ExchangeTypeTopic   ExchangeType = "topic"
	ExchangeTypeHeaders ExchangeType = "headers"

	FieldNameQueue = "queue"
)

func (e ExchangeType) String() string {
	return string(e)
}

type Exchange struct {
	name       string
	kind       ExchangeType
	durable    bool
	autoDelete bool
	internal   bool
	noWait     bool
}

type exchangeOption func(*Exchange)

func ExchangeDurable(durable bool) exchangeOption {
	return func(e *Exchange) {
		e.durable = durable
	}
}

func ExchangeAutoDelete(autoDelete bool) exchangeOption {
	return func(e *Exchange) {
		e.autoDelete = autoDelete
	}
}

func ExchangeInternal(internal bool) exchangeOption {
	return func(e *Exchange) {
		e.internal = internal
	}
}

func ExchangeNoWait(noWait bool) exchangeOption {
	return func(e *Exchange) {
		e.noWait = noWait
	}
}

func defaultExchangeOpts() []exchangeOption {
	return []exchangeOption{
		ExchangeDurable(true),
		ExchangeAutoDelete(false),
		ExchangeInternal(false),
		ExchangeNoWait(false),
	}
}

func NewExchange(name string, kind ExchangeType, opts ...exchangeOption) *Exchange {
	e := &Exchange{
		name: name,
		kind: kind,
	}
	for _, opt := range append(defaultExchangeOpts(), opts...) {
		opt(e)
	}
	return e
}

type Queue struct {
	name       string
	durable    bool
	autoDelete bool
	exclusive  bool
	noWait     bool
}

type queueOption func(*Queue)

func QueueDurable(durable bool) queueOption {
	return func(q *Queue) {
		q.durable = durable
	}
}

func QueueAutoDelete(autoDelete bool) queueOption {
	return func(q *Queue) {
		q.autoDelete = autoDelete
	}
}

func QueueExclusive(exclusive bool) queueOption {
	return func(q *Queue) {
		q.exclusive = exclusive
	}
}

func QueueNoWait(noWait bool) queueOption {
	return func(q *Queue) {
		q.noWait = noWait
	}
}

func QueueName(name string) queueOption {
	return func(q *Queue) {
		q.name = name
	}
}

func defaultQueueOpts(consumerName string) []queueOption {
	return []queueOption{
		QueueName(consumerName),
		QueueDurable(true),
		QueueAutoDelete(false),
		QueueExclusive(false),
		QueueNoWait(false),
	}
}

func NewQueue(consumerName string, opts ...queueOption) *Queue {
	q := new(Queue)

	if len(consumerName) < 1 {
		panic(errors.New("name cannot be empty"))
	}
	for _, opt := range append(defaultQueueOpts(consumerName), opts...) {
		opt(q)
	}
	if len(q.name) < 1 {
		panic(errors.New("queue.name cannot be empty"))
	}

	return q
}

type (
	RoutingKeyPart string
	routingKey     []RoutingKeyPart
)

func (rkp RoutingKeyPart) String() string {
	return string(rkp)
}

const (
	RoutingKeyPartMatchAnyWord  RoutingKeyPart = "*"
	RoutingKeyPartMatchAnyWords RoutingKeyPart = "#"
)

func (rk routingKey) String() string {
	if len(rk) < 1 {
		return ""
	}

	keyName := rk[0].String()
	for i := 1; i < len(rk); i++ {
		keyName += "." + rk[i].String()
	}

	return strings.Join(
		slicesx.Map(rk, func(rkp RoutingKeyPart) string { return rkp.String() }), ".",
	)
}

func RoutingKey(parts ...RoutingKeyPart) routingKey {
	return routingKey(parts)
}

type client struct {
	conn Connection
	ch   *amqp091.Channel
	log  logger.Logger

	exchange *Exchange
}

func newClient(
	conn Connection,
	log logger.Logger,
	e *Exchange,
) (cli *client, err error) {
	cli = &client{
		conn: conn,
		log:  log,
	}
	cli.ch, err = conn.Channel()
	if err != nil {
		return nil, err
	}

	if err := cli.ch.ExchangeDeclare(e.name, e.kind.String(), e.durable, e.autoDelete, e.internal, e.noWait, nil); err != nil {
		return nil, err
	}
	log.Debug("exchange with name: %q, type: %q, declared", e.name, e.kind.String())
	cli.exchange = e

	return cli, nil
}

func (c *client) reconnect() error {
	cli, err := newClient(c.conn, c.log, c.exchange)
	if err == nil {
		*c = *cli
	}
	return err
}
