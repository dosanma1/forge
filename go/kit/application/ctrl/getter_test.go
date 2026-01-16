package ctrl_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/usecase/usecasetest"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/search/searchtest"
	"github.com/stretchr/testify/assert"
)

func TestNewGetter(t *testing.T) {
	ctx := context.Background()
	opts := []query.Option{}
	defaultOpts := []query.Option{query.FilterBy(filter.OpEq, "test", "123")}
	var res *resourcetest.ResourceStub
	var err error

	t.Run("returning error", func(t *testing.T) {
		res = nil
		err = assert.AnError

		getterUcase := usecasetest.NewGetterStub(
			res, err, usecasetest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t,
						gotOpts,
						[]search.Option{search.WithQueryOpts(append(opts, defaultOpts...)...)},
					)
				},
			),
		)
		getterCtrl := ctrl.NewGetter[*resourcetest.ResourceStub](getterUcase, defaultOpts...)

		gotResource, gotErr := getterCtrl.Get(ctx, opts)
		assert.Nil(t, gotResource)
		assert.ErrorIs(t, gotErr, err)
	})

	t.Run("returning resource", func(t *testing.T) {
		res = resourcetest.NewStub()
		err = nil

		getterUcase := usecasetest.NewGetterStub(
			res, err, usecasetest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					ctx = gotCtx
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t,
						gotOpts,
						[]search.Option{search.WithQueryOpts(append(opts, defaultOpts...)...)},
					)
				},
			),
		)
		getterCtrl := ctrl.NewGetter[*resourcetest.ResourceStub](getterUcase, defaultOpts...)

		gotResource, gotErr := getterCtrl.Get(ctx, opts)
		assert.Equal(t, res, gotResource)
		assert.NoError(t, gotErr)
	})
}
