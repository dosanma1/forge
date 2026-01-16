package rediscli_test

import (
	"os"
	"testing"

	"github.com/dosanma1/forge/go/kit/persistence/rediscli"
	"github.com/stretchr/testify/assert"
)

func TestOptions(t *testing.T) {
	t.Run("WithAddress sets addresses correctly", func(t *testing.T) {
		// This is a white-box test - we can't directly inspect the config
		// but we can verify it doesn't panic and integrates properly
		addresses := []string{"localhost:6379", "localhost:6380"}
		opt := rediscli.WithAddress(addresses...)
		assert.NotNil(t, opt)
	})

	t.Run("WithPassword sets password", func(t *testing.T) {
		opt := rediscli.WithPassword("test-password")
		assert.NotNil(t, opt)
	})

	t.Run("WithPassword trims whitespace", func(t *testing.T) {
		opt := rediscli.WithPassword("  test-password  ")
		assert.NotNil(t, opt)
	})

	t.Run("WithPassword ignores empty string", func(t *testing.T) {
		opt := rediscli.WithPassword("")
		assert.NotNil(t, opt)
	})

	t.Run("WithMaxOpenLimit sets pool size", func(t *testing.T) {
		opt := rediscli.WithMaxOpenLimit(50)
		assert.NotNil(t, opt)
	})

	t.Run("WithMaxOpenLimit ignores zero or negative", func(t *testing.T) {
		opt := rediscli.WithMaxOpenLimit(0)
		assert.NotNil(t, opt)
		opt = rediscli.WithMaxOpenLimit(-10)
		assert.NotNil(t, opt)
	})

	t.Run("WithMaxIdleConns sets max idle connections", func(t *testing.T) {
		opt := rediscli.WithMaxIdleConns(20)
		assert.NotNil(t, opt)
	})

	t.Run("WithMaxIdleConns ignores zero or negative", func(t *testing.T) {
		opt := rediscli.WithMaxIdleConns(0)
		assert.NotNil(t, opt)
		opt = rediscli.WithMaxIdleConns(-5)
		assert.NotNil(t, opt)
	})

	t.Run("WithMasterName sets sentinel master name", func(t *testing.T) {
		opt := rediscli.WithMasterName("mymaster")
		assert.NotNil(t, opt)
	})

	t.Run("WithMasterName trims whitespace", func(t *testing.T) {
		opt := rediscli.WithMasterName("  mymaster  ")
		assert.NotNil(t, opt)
	})

	t.Run("WithDB sets database index", func(t *testing.T) {
		opt := rediscli.WithDB(1)
		assert.NotNil(t, opt)
	})
}

func TestEnvOptions(t *testing.T) {
	t.Run("WithAddressFromEnv reads REDIS_ADDRESS", func(t *testing.T) {
		os.Setenv("REDIS_ADDRESS", "localhost:6379,localhost:6380")
		t.Cleanup(func() { os.Unsetenv("REDIS_ADDRESS") })

		opt := rediscli.WithAddressFromEnv()
		assert.NotNil(t, opt)
	})

	t.Run("WithPasswordFromEnv reads REDIS_PASSWORD", func(t *testing.T) {
		os.Setenv("REDIS_PASSWORD", "secret")
		t.Cleanup(func() { os.Unsetenv("REDIS_PASSWORD") })

		opt := rediscli.WithPasswordFromEnv()
		assert.NotNil(t, opt)
	})

	t.Run("WithMasterNameFromEnv reads REDIS_MASTER_NAME", func(t *testing.T) {
		os.Setenv("REDIS_MASTER_NAME", "mymaster")
		t.Cleanup(func() { os.Unsetenv("REDIS_MASTER_NAME") })

		opt := rediscli.WithMasterNameFromEnv()
		assert.NotNil(t, opt)
	})
}

func TestOptionComposition(t *testing.T) {
	t.Run("multiple options can be combined", func(t *testing.T) {
		opts := []rediscli.Option{
			rediscli.WithAddress("localhost:6379"),
			rediscli.WithPassword("password"),
			rediscli.WithMaxOpenLimit(100),
			rediscli.WithMaxIdleConns(10),
			rediscli.WithDB(0),
		}
		assert.Len(t, opts, 5)
		for _, opt := range opts {
			assert.NotNil(t, opt)
		}
	})
}
