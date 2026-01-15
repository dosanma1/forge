package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type Getter[R resource.Resource] interface {
	Get(ctx context.Context, opts []query.Option) (R, error)
}

type getter[R resource.Resource] struct {
	ucase       usecase.Getter[R]
	defaultOpts []query.Option
}

func (c *getter[R]) Get(ctx context.Context, opts []query.Option) (R, error) {
	opts = append(opts, c.defaultOpts...)
	return c.ucase.Get(ctx, search.WithQueryOpts(opts...))
}

func NewGetter[R resource.Resource](ucase usecase.Getter[R], defaultOpts ...query.Option) *getter[R] {
	return &getter[R]{
		ucase:       ucase,
		defaultOpts: defaultOpts,
	}
}
