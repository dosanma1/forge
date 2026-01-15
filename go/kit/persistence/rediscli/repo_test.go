package rediscli_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/rediscli"
	"github.com/dosanma1/forge/go/kit/persistence/rediscli/redistest"
)

func TestNewRepo(t *testing.T) {
	db := redistest.GetDB(t)

	t.Run("new repo with redis client return repo", func(t *testing.T) {
		repo, err := rediscli.NewRepo(db.Client)
		assert.NoError(t, err)
		assert.NotNil(t, repo)
	})

	t.Run("new repo with nil redis client return error", func(t *testing.T) {
		repo, err := rediscli.NewRepo(nil)
		assert.EqualError(t, err, rediscli.ErrRedisMissingRedisConn.Error())
		assert.Nil(t, repo)
	})
}
