package usecase_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/application/repository/repositorytest"
	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/searchtest"
	"github.com/stretchr/testify/assert"
)

func TestNewGetter(t *testing.T) {
	ctx := context.Background()
	inOpts := searchtest.AnyOpts()
	inType := resource.Type(resourcetest.NewStub().Type())

	var res *resourcetest.ResourceStub
	var err error

	t.Run("returning error", func(t *testing.T) {
		res = nil
		err = assert.AnError

		getterRepo := repositorytest.NewGetterStub(
			res, err, repositorytest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t, gotOpts, inOpts)
				},
			),
		)
		getterUcase := usecase.NewGetter[*resourcetest.ResourceStub](getterRepo, inType)

		gotResource, gotErr := getterUcase.Get(ctx, inOpts...)
		assert.Nil(t, gotResource)
		assert.ErrorIs(t, gotErr, err)
	})
	t.Run("repo returns nil, return not found", func(t *testing.T) {
		res = nil
		err = nil

		getterRepo := repositorytest.NewGetterStub(
			res, err, repositorytest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t, gotOpts, inOpts)
				},
			),
		)
		getterUcase := usecase.NewGetter[*resourcetest.ResourceStub](getterRepo, inType)

		gotResource, gotErr := getterUcase.Get(ctx, inOpts...)
		assert.Nil(t, gotResource)
		assert.ErrorIs(t, gotErr, errors.NotFound(
			inType.String(),
			search.FieldNameSearch.Merge(search.FieldNameOptions).String(),
		))
	})
	t.Run("repo returns resource and no error", func(t *testing.T) {
		res = resourcetest.NewStub()
		err = nil

		getterRepo := repositorytest.NewGetterStub(
			res, err, repositorytest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t, gotOpts, inOpts)
				},
			),
		)
		getterUcase := usecase.NewGetter[*resourcetest.ResourceStub](getterRepo, inType)

		gotResource, gotErr := getterUcase.Get(ctx, inOpts...)
		assert.Equal(t, gotResource, res)
		assert.NoError(t, gotErr)
	})
}
