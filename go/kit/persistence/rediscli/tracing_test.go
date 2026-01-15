package rediscli_test

import (
	"fmt"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"

	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/rediscli"
)

func TestNewTracingConfig(t *testing.T) {
	t.Parallel()

	dbIdx := 0
	conn := &url.URL{
		Host:   "localhost:6379",
		Scheme: "redis",
	}

	config := rediscli.NewTracingConfig(dbIdx, conn)

	assert.Equal(t, persistence.DBSystem(otelsemconv.DBSystemRedis.Value.AsString()), config.System())
	assert.Equal(t, fmt.Sprintf("%d", dbIdx), config.DBName())
	assert.Equal(t, persistence.SpanAttr(otelsemconv.DBRedisDBIndexKey), config.DBNameAttr())
	assert.Empty(t, config.TableNameAttr().String())
	assert.False(t, config.ExcludeQueryVars())
	assert.Equal(t, conn, config.Conn())
	assert.Equal(
		t,
		[]persistence.DBOp{
			"GET", "DEL", "EXISTS", "SET", "KEYS", "INCR",
			"HGET", "HGETALL", "HDEL", "HEXISTS", "HSET", "HKEYS",
			"HMGET", "HMSET",
			"EXPIRE", "SELECT", "RENAMENX",
		}, config.DBOps(),
	)
}
