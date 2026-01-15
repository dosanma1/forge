package pg

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type deleter[T any] struct {
	*Repo
	validationFunc func(query.Query) error
}

func NewDeleter[T any](repo *Repo, queryValFunc func(query.Query) error) *deleter[T] {
	return &deleter[T]{
		Repo:           repo,
		validationFunc: queryValFunc,
	}
}

func (r *deleter[T]) Delete(ctx context.Context, delType repository.DeleteType, opts ...search.Option) error {
	s := search.New(opts...)
	err := r.validationFunc(s.Query())
	if err != nil {
		return err
	}

	op := r.QueryApply(ctx, s.Query())
	if delType == repository.DeleteTypeHard {
		op = op.Unscoped()
	}

	var res T
	err = op.Delete(&res).Error
	if err != nil {
		return NewErrUnknown(err)
	}

	return nil
}
