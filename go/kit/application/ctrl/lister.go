package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type Lister[R resource.Resource] interface {
	List(ctx context.Context, opts []query.Option) (resource.ListResponse[R], error)
}

type lister[R resource.Resource] struct {
	usecase          usecase.Lister[R]
	defaultQueryOpts []query.Option
}

func NewLister[R resource.Resource](uc usecase.Lister[R], defaultQueryOpts ...query.Option) *lister[R] {
	return &lister[R]{
		usecase:          uc,
		defaultQueryOpts: defaultQueryOpts,
	}
}

func (c *lister[R]) List(ctx context.Context, opts []query.Option) (resource.ListResponse[R], error) {
	opts = append(c.defaultQueryOpts, opts...)
	return c.usecase.List(ctx, search.WithQueryOpts(opts...))
}
