package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/resource"
)

type Creator[R resource.Resource] interface {
	Create(context.Context, R) (R, error)
}

type creator[R resource.Resource] struct {
	usecase usecase.Creator[R]
}

func (c *creator[R]) Create(ctx context.Context, r R) (R, error) {
	return c.usecase.Create(ctx, r)
}

func NewCreator[R resource.Resource](uc usecase.Creator[R]) Creator[R] {
	return &creator[R]{usecase: uc}
}

type CreatorBatch[R resource.Resource] interface {
	CreateBatch(context.Context, []R) ([]R, error)
}

type creatorBatch[R resource.Resource] struct {
	usecase usecase.CreatorBatch[R]
}

func (c *creatorBatch[R]) CreateBatch(ctx context.Context, r []R) ([]R, error) {
	return c.usecase.CreateBatch(ctx, r)
}

func NewCreatorBatch[R resource.Resource](uc usecase.CreatorBatch[R]) CreatorBatch[R] {
	return &creatorBatch[R]{usecase: uc}
}
