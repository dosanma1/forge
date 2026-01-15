package rediscli_test

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/rediscli"
	"github.com/dosanma1/forge/go/kit/persistence/rediscli/redistest"
)

type clientTestWant struct {
	res           any
	err           error
	panics        bool
	spanAssertion func(t *testing.T, startTime time.Time, trace *tracertest.Span)
}
type clientTest struct {
	name       string
	execCliOps []func(cli *rediscli.Client) (any, error)
	want       []*clientTestWant
}

//nolint:funlen // test
func TestNewClient(t *testing.T) {
	t.Parallel()

	var (
		ctx                       = context.Background()
		tracr, cli, connSpanAttrs = initConfig(t)
	)
	t.Cleanup(func() { cli.Close() })

	tests := []*clientTest{
		{
			name: "SET kv with an expiry and GET k before expiry returns v",
			execCliOps: []func(cli *rediscli.Client) (any, error){
				func(cli *rediscli.Client) (any, error) {
					return cli.Set(ctx, "x", "y", 60*time.Second).Result()
				},
				func(cli *rediscli.Client) (any, error) {
					return cli.Get(ctx, "x").Result()
				},
			},
			want: []*clientTestWant{
				{
					"OK", nil, false,
					assertSpan("SET 0",
						mergeSpanAttrs(
							opAttrs("SET"), connSpanAttrs(0), redisDBIndexAttrs("0"),
							statementAttrs("set x y ex 60")),
						tracertest.SpanStatusOK(),
					),
				},
				{
					"y", nil, false,
					assertSpan("GET 0",
						mergeSpanAttrs(
							opAttrs("GET"), connSpanAttrs(0), redisDBIndexAttrs("0"),
							statementAttrs("get x")),
						tracertest.SpanStatusOK(),
					),
				},
			},
		},
		{
			name: "find unexisting key returns empty result with redis.Nil err but span status is not an error (not founds should not be traced as errors)",
			execCliOps: []func(cli *rediscli.Client) (any, error){
				func(cli *rediscli.Client) (any, error) {
					return cli.Get(ctx, "unexistingkey").Result()
				},
			},
			want: []*clientTestWant{
				{
					"", redis.Nil, false,
					assertSpan("GET 0",
						mergeSpanAttrs(
							opAttrs("GET"), connSpanAttrs(0), redisDBIndexAttrs("0"),
							statementAttrs("get unexistingkey")),
						tracertest.SpanStatusOK(),
					),
				},
			},
		},
		{
			name: "change db index and find key which was set in another db index results in not found with a span with no err status",
			execCliOps: []func(cli *rediscli.Client) (any, error){
				func(cli *rediscli.Client) (any, error) {
					return cli.Do(ctx, "SELECT", 1).Result()
				},
				func(cli *rediscli.Client) (any, error) {
					return cli.Get(ctx, "x").Result()
				},
			},
			want: []*clientTestWant{
				{
					"OK", nil, false,
					assertSpan("SELECT 0",
						mergeSpanAttrs(
							opAttrs("SELECT"), connSpanAttrs(0), redisDBIndexAttrs("0"),
							statementAttrs("SELECT 1")),
						tracertest.SpanStatusOK(),
					),
				},
				{
					"", redis.Nil, false,
					assertSpan("GET 1",
						mergeSpanAttrs(
							opAttrs("GET"), connSpanAttrs(1), redisDBIndexAttrs("1"),
							statementAttrs("get x"),
						),
						tracertest.SpanStatusOK(),
					),
				},
			},
		},
		{
			name: "In a pipeline execute INCR counter and EXPIRE",
			execCliOps: []func(cli *rediscli.Client) (any, error){
				func(cli *rediscli.Client) (any, error) {
					pipe := cli.Pipeline()
					incr := pipe.Incr(ctx, "pipeline_counter")
					pipe.Expire(ctx, "pipeline_counter", time.Hour)
					_, err := pipe.Exec(ctx)
					return incr.Val(), err
				},
			},
			want: []*clientTestWant{
				{
					int64(1), nil, false,
					assertSpan("INCR EXPIRE 1",
						mergeSpanAttrs(
							opAttrs("INCR EXPIRE"), connSpanAttrs(1), redisDBIndexAttrs("1"),
							statementAttrs("incr pipeline_counter\nexpire pipeline_counter 3600")),
						tracertest.SpanStatusOK(),
					),
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			for i, op := range test.execCliOps {
				reqTime := time.Now().UTC()

				if test.want[i].panics {
					assert.True(t, assert.Panics(t, func() { op(cli) }))
					continue
				}

				gotVal, gotErr := op(cli)
				assert.ErrorIs(t, gotErr, test.want[i].err)
				assert.Equal(t, test.want[i].res, gotVal)

				test.want[i].spanAssertion(t, reqTime, tracr.Spans()[len(tracr.Spans())-1])
			}
		})
	}
}

func initConfig(t *testing.T) (*tracertest.Recorder, *rediscli.Client, func(dbIndex int) []any) {
	t.Helper()

	db := redistest.GetDB(t)

	connNoCreds := fmt.Sprintf("redis://---:---@%s", db.ConnAddr)
	addr := strings.Split(db.ConnAddr, ":")
	connSpanAttrs := func(dbIndex int) []any {
		return []any{
			"db.system", "redis", "db.connection_string", fmt.Sprintf("%s/%d", connNoCreds, dbIndex),
			"server.socket.address", addr[0], "server.socket.port", addr[1],
		}
	}
	return db.Tracer(), db.Client, connSpanAttrs
}

func assertSpan(name string, attrs []any, opts ...tracertest.AssertSpanOpt) func(t *testing.T, startTime time.Time, trace *tracertest.Span) {
	return func(t *testing.T, startTime time.Time, span *tracertest.Span) {
		t.Helper()

		tracertest.AssertSpan(t, span,
			append(opts,
				tracertest.SpanName(name),
				tracertest.SpanAttrs(attrs...),
				tracertest.SpanEnded(),
				tracertest.SpanStartedAfter(startTime),
				tracertest.SpanKind(tracer.SpanKindClient),
			)...,
		)
	}
}

func opAttrs(op persistence.DBOp) []any      { return []any{"db.operation", op.String()} }
func redisDBIndexAttrs(dbIndex string) []any { return []any{"db.redis.database_index", dbIndex} }
func statementAttrs(statement string) []any  { return []any{"db.statement", statement} }
func mergeSpanAttrs(attrs ...[]any) []any {
	res := []any{}
	for _, attr := range attrs {
		res = append(res, attr...)
	}
	return res
}
