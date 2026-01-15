package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/resource"
)

type Updater[R resource.Resource] interface {
	Update(context.Context, R) (R, error)
}

type updater[R resource.Resource] struct {
	usecase usecase.Updater[R]
}

func NewUpdater[R resource.Resource](uc usecase.Updater[R]) *updater[R] {
	return &updater[R]{
		usecase: uc,
	}
}

func (u *updater[R]) Update(ctx context.Context, req R) (R, error) {
	return u.usecase.Update(ctx, req)
}
