package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/resource"
)

type (
	Patcher[R any] interface {
		Patch(context.Context, []repository.PatchOption) (R, error)
	}
)

type patcher[R resource.Resource] struct {
	usecase usecase.Patcher[R]
}

func (u *patcher[R]) Patch(ctx context.Context, opts []repository.PatchOption) (R, error) {
	return u.usecase.Patch(ctx, opts...)
}

func NewPatcher[R resource.Resource](uc usecase.Patcher[R]) Patcher[R] {
	return &patcher[R]{
		usecase: uc,
	}
}
