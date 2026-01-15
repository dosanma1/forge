//go:build integration
// +build integration

package firebase_test

import (
	"path/filepath"
	"testing"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/sops"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserManagement(t *testing.T) {
	sops.NewSOPSEnvVarLoader().LoadEnvFromFile(t, filepath.Join("testdata", "integ.yaml"))

	var (
		cli = firebase.NewClient()
		ctx = t.Context()
	)

	var (
		user1 = NewUser(
			"test1@example.com",
			"pass123",
			"John",
			WithID(uuid.NewString()),
			WithUserLastName("Doe"),
			WithUserEmailVerified(true),
		)
		user2 = NewUser(
			"test2@example.com",
			"pass456",
			"Jane",
			WithID(uuid.NewString()),
			WithUserLastName("Smith"),
			WithUserEmailVerified(false),
		)
	)

	var createdUser1, createdUser2 User
	var err error

	t.Run("create user", func(t *testing.T) {
		createdUser1, err = cli.UserManagement().Create(ctx, user1)
		require.NoError(t, err)
		require.NotNil(t, createdUser1)
		assert.Equal(t, user1.Email(), createdUser1.Email())
		assert.Equal(t, user1.FirstName(), createdUser1.FirstName())
		assert.Equal(t, user1.EmailVerified(), createdUser1.EmailVerified())
		assert.NotEmpty(t, createdUser1.ID())
	})

	t.Run("duplicate user", func(t *testing.T) {
		duplicateUser, err := cli.UserManagement().Create(ctx, user1)
		require.Error(t, err)
		assert.Nil(t, duplicateUser)
	})

	t.Run("create different user", func(t *testing.T) {
		createdUser2, err = cli.UserManagement().Create(ctx, user2)
		require.NoError(t, err)
		require.NotNil(t, createdUser2)
		assert.Equal(t, user2.Email(), createdUser2.Email())
		assert.Equal(t, user2.FirstName(), createdUser2.FirstName())
		assert.Equal(t, user2.EmailVerified(), createdUser2.EmailVerified())
		assert.NotEmpty(t, createdUser2.ID())
	})

	t.Run("get user", func(t *testing.T) {
		foundUser, err := cli.UserManagement().Get(ctx, []query.Option{
			query.FilterBy(filter.OpEq, fields.NameID, createdUser1.ID()),
		})
		require.NoError(t, err)
		require.NotNil(t, foundUser)
		assert.Equal(t, createdUser1.ID(), foundUser.ID())
		assert.Equal(t, createdUser1.Email(), foundUser.Email())
		assert.Equal(t, createdUser1.FirstName(), foundUser.FirstName())
		assert.Equal(t, createdUser1.EmailVerified(), foundUser.EmailVerified())
	})

	t.Run("patch user", func(t *testing.T) {
		updatedUser, err := cli.UserManagement().Patch(ctx, []repository.PatchOption{
			repository.PatchSearchOpts(search.WithQueryOpts(query.FilterBy(filter.OpEq, fields.NameID, createdUser1.ID()))),
			repository.PatchField(fields.NameEmail, "updated1@example.com"),
		})
		require.NoError(t, err)
		require.NotNil(t, updatedUser)
		assert.Equal(t, "updated1@example.com", updatedUser.Email())
		assert.Equal(t, createdUser1.ID(), updatedUser.ID())
	})

	t.Run("delete user", func(t *testing.T) {
		// Test delete user1
		_, err := cli.UserManagement().Delete(ctx, []query.Option{
			query.FilterBy(filter.OpEq, fields.NameID, createdUser1.ID()),
		})
		require.NoError(t, err)

		// Verify user is deleted by trying to get it
		deletedUser, err := cli.UserManagement().Get(ctx, []query.Option{
			query.FilterBy(filter.OpEq, fields.NameID, createdUser1.ID()),
		})
		require.Error(t, err)
		assert.Nil(t, deletedUser)

		// Test delete user2
		_, err = cli.UserManagement().Delete(ctx, []query.Option{
			query.FilterBy(filter.OpEq, fields.NameID, createdUser2.ID()),
		})
		require.NoError(t, err)

		// Verify user is deleted by trying to get it
		deletedUser2, err := cli.UserManagement().Get(ctx, []query.Option{
			query.FilterBy(filter.OpEq, fields.NameID, createdUser2.ID()),
		})
		require.Error(t, err)
		assert.Nil(t, deletedUser2)
	})
}
