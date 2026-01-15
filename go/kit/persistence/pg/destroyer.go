package pg

import (
	"context"

	"github.com/dosanma1/forge/go/kit/search"
)

type destroyer[R any] struct {
	Repo
}

func NewDestroyer[R any](repo Repo) *destroyer[R] {
	return &destroyer[R]{
		Repo: repo,
	}
}

func (d *destroyer[R]) Destroy(ctx context.Context, opts ...search.Option) error {
	s := search.New(opts...)

	var res R
	return d.QueryApply(ctx, s.Query()).Unscoped().Delete(&res).Error
}
