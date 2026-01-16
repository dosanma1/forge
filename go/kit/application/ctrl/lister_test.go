package ctrl_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/usecase/usecasetest"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/search/searchtest"
	"github.com/stretchr/testify/assert"
)

func TestNewLister(t *testing.T) {
	ctx := context.Background()
	defaultOpts := []query.Option{
		query.FilterBy(filter.OpEq, "test", "123"),
		query.SortBy("id", query.SortDesc),
	}
	var res resource.ListResponse[*resourcetest.ResourceStub]
	var err error

	t.Run("on error returns the error and an empty list", func(t *testing.T) {
		res = resource.NewListResponse([]*resourcetest.ResourceStub{}, 0)
		err = assert.AnError

		opts := []query.Option{}

		listerUcase := usecasetest.NewListerStub(
			res, err, usecasetest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t,
						[]search.Option{search.WithQueryOpts(append(defaultOpts, opts...)...)},
						gotOpts,
					)
				},
			),
		)
		listerCtrl := ctrl.NewLister(listerUcase, defaultOpts...)

		gotResource, gotErr := listerCtrl.List(ctx, opts)
		assert.Equal(t, gotResource, res)
		assert.ErrorIs(t, gotErr, err)
	})

	t.Run("lister with default query options append provided query options", func(t *testing.T) {
		res = resource.NewListResponse([]*resourcetest.ResourceStub{resourcetest.NewStub()}, 100)
		err = nil

		opts := []query.Option{query.SortBy("id", query.SortAsc)}

		listerUcase := usecasetest.NewListerStub(
			res, err, usecasetest.WithStubInterceptor(
				func(gotCtx context.Context, gotOpts ...search.Option) {
					assert.Equal(t, gotCtx, ctx)
					searchtest.OptsEqual(t,
						[]search.Option{search.WithQueryOpts(append(defaultOpts, opts...)...)},
						gotOpts,
					)
				},
			),
		)
		listerCtrl := ctrl.NewLister(listerUcase, defaultOpts...)

		gotResource, gotErr := listerCtrl.List(ctx, opts)
		assert.Equal(t, gotResource.Results(), res.Results())
		assert.Equal(t, gotResource.TotalCount(), res.TotalCount())
		assert.ErrorIs(t, gotErr, err)
	})

	t.Run("returning list", func(t *testing.T) {
		res = resource.NewListResponse([]*resourcetest.ResourceStub{resourcetest.NewStub()}, 100)
		err = nil

		opts := []query.Option{}

		listerUcase := usecasetest.NewListerStub(
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
		listerCtrl := ctrl.NewLister(listerUcase, defaultOpts...)

		gotResource, gotErr := listerCtrl.List(ctx, opts)
		assert.Equal(t, gotResource.Results(), res.Results())
		assert.Equal(t, gotResource.TotalCount(), res.TotalCount())
		assert.ErrorIs(t, gotErr, err)
	})
}
