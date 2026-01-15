package redistest

import (
	"context"
	"sync"
	"testing"

	"github.com/orlangure/gnomock"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence/rediscli"

	"github.com/orlangure/gnomock/preset/redis"
)

var (
	//nolint: gochecknoglobals // singleton
	database *db
	//nolint: gochecknoglobals // singleton
	once sync.Once
)

type db struct {
	*rediscli.Client
	tracer   *tracertest.Recorder
	ConnAddr string
}

func (db *db) Tracer() *tracertest.Recorder {
	return db.tracer
}

func GetDB(t *testing.T) *db {
	t.Helper()

	once.Do(
		func() {
			loggerInstance := logger.New(
				logger.WithType(logger.ZapLogger),
				logger.WithLevel(logger.LogLevelDebug),
			)
			monitor := monitoring.New(loggerInstance, tracertest.NewRecorderTracer())
			database = helperCreateRedisContainer(t, monitor)
		})

	return database
}

func helperCreateRedisContainer(t *testing.T, m monitoring.Monitor) *db {
	t.Helper()

	p := redis.Preset(redis.WithVersion("7.0.11"))
	container, err := gnomock.Start(p)
	assert.NoError(t, err)

	addr := container.DefaultAddress()
	client, err := rediscli.New(m, rediscli.WithAddress(addr))
	assert.NoError(t, err)
	assert.NotNil(t, client)
	cmd, err := client.ConfigSet(context.TODO(), "notify-keyspace-events", "KEA").Result()
	assert.NoError(t, err)
	assert.Equal(t, "OK", cmd)

	return &db{
		Client:   client,
		tracer:   m.Tracer().(*tracertest.Recorder),
		ConnAddr: addr,
	}
}
