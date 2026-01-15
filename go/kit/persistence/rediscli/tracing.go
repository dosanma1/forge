package rediscli

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"strconv"
	"strings"

	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"

	"github.com/redis/go-redis/extra/rediscmd/v9"
	"github.com/redis/go-redis/v9"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/persistence"
)

const (
	baseTracingHookName = "db-tracing"
)

func instrumentTracing(rdb redis.UniversalClient, t tracer.Tracer) error {
	switch rdb := rdb.(type) {
	case *redis.Client:
		opt := rdb.Options()

		addr := opt.Addr
		if addr == "FailoverClient" {
			info, err := rdb.ClientInfo(context.Background()).Result()
			if err != nil {
				return err
			}

			addr = info.LAddr
		}
		rdb.AddHook(newTracingHook(rdb, t, opt.DB, addr))
		return nil
	default:
		return fields.NewErrInvalid("", fields.NewWrappedErr("tracer hook: %T not supported", rdb))
	}
}

type tracingHook struct {
	hookName string
	dbIndex  int
	address  string
	tracer   persistence.Tracer
	cli      *redis.Client
}

func newTracingHook(cli *redis.Client, t tracer.Tracer, db int, addr string) *tracingHook {
	tracerConfig := NewTracingConfig(db, generateConnURL(addr, db))
	hookName := fmt.Sprintf("%s-%s", baseTracingHookName, tracerConfig.System())
	newTracer := persistence.NewTracer(t, tracerConfig)

	return &tracingHook{
		cli:      cli,
		hookName: hookName,
		dbIndex:  db,
		address:  addr,
		tracer:   newTracer,
	}
}

func (th *tracingHook) DialHook(hook redis.DialHook) redis.DialHook {
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		conn, err := hook(ctx, network, addr)
		if err != nil {
			return nil, err
		}

		th.address = conn.RemoteAddr().String()
		th.tracer.(persistence.NetworkChangeListener).ConnChanged(generateConnURL(conn.RemoteAddr().String(), th.dbIndex))

		return conn, nil
	}
}

func (th *tracingHook) ProcessHook(hook redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, cmd redis.Cmder) error {
		currentDBIndex := th.dbIndex

		opCtx := th.tracer.TraceOpStart(ctx,
			persistence.DBOp(strings.ToUpper(cmd.FullName())),
			persistence.TraceStatement(rediscmd.CmdString(cmd)),
			persistence.TraceDBName(fmt.Sprintf("%d", currentDBIndex)),
		)

		err := hook(opCtx, cmd)

		th.tracer.TraceOpEnd(
			opCtx, persistence.DBOp(strings.ToUpper(cmd.FullName())), err,
		)

		if err == nil && strings.ToUpper(cmd.FullName()) == dbOpSelectDB.String() {
			th.handleSwitchDB(cmd)
		}

		return err
	}
}

func (th *tracingHook) handleSwitchDB(cmd redis.Cmder) {
	if len(cmd.Args()) < 1 {
		return
	}

	switch val := cmd.Args()[1].(type) {
	case int:
		th.dbIndex = val
	case int64:
		th.dbIndex = int(val)
	case string:
		var err error
		th.dbIndex, err = strconv.Atoi(val)
		if err != nil {
			panic(err)
		}
	default:
		panic(fields.NewWrappedErr("handle switch DB: unexpected type=%T for DB Index", val))
	}

	th.tracer.(persistence.NetworkChangeListener).
		ConnChanged(generateConnURL(th.address, th.dbIndex))
	th.tracer.(persistence.NameChangeListener).
		NameChanged(fmt.Sprintf("%d", th.dbIndex))
}

func (th *tracingHook) ProcessPipelineHook(
	hook redis.ProcessPipelineHook,
) redis.ProcessPipelineHook {
	return func(ctx context.Context, cmds []redis.Cmder) error {
		summary, cmdsString := rediscmd.CmdsString(cmds)

		opCtx := th.tracer.TraceOpStart(ctx,
			persistence.DBOp(strings.ToUpper(summary)),
			persistence.TraceStatement(cmdsString),
			persistence.TraceDBName(fmt.Sprintf("%d", th.dbIndex)),
			persistence.WithMultiCmdOp(),
		)

		err := hook(opCtx, cmds)

		th.tracer.TraceOpEnd(
			opCtx, persistence.DBOp(strings.ToUpper(summary)), err, persistence.WithMultiCmdOp(),
		)
		return err
	}
}

func generateConnURL(addr string, db int) *url.URL {
	u, err := url.Parse(fmt.Sprintf("redis://%s/%d", addr, db))
	if err != nil {
		panic(err)
	}

	return u
}

const dbOpSelectDB persistence.DBOp = "SELECT"

func NewTracingConfig(dbIndex int, connURL *url.URL) persistence.TracingConfig {
	dbOps := []persistence.DBOp{
		"GET", "DEL", "EXISTS", "SET", "KEYS", "INCR",
		"HGET", "HGETALL", "HDEL", "HEXISTS", "HSET", "HKEYS",
		"HMGET", "HMSET",
		"EXPIRE", dbOpSelectDB, "RENAMENX",
	}

	return persistence.NewTracingConfig(
		persistence.DBSystem(otelsemconv.DBSystemRedis.Value.AsString()),
		fmt.Sprintf("%d", dbIndex), connURL,
		persistence.SpanAttr(otelsemconv.DBRedisDBIndexKey),
		dbOps,
		errors.SkipErrIfOneOf(redis.Nil),
	)
}
