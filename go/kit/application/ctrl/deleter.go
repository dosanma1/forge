package ctrl

import (
	"context"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/application/usecase"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type Deleter interface {
	Delete(context.Context, []query.Option) (string, error)
}

type deleter struct {
	uc               usecase.Deleter
	deleteType       repository.DeleteType
	defaultQueryOpts []query.Option
}

func NewDeleter(uc usecase.Deleter, deleteType repository.DeleteType, defaultQueryOpts ...query.Option) *deleter {
	return &deleter{
		uc:         uc,
		deleteType: deleteType,
	}
}

func (d *deleter) Delete(ctx context.Context, opts []query.Option) (string, error) {
	opts = append(opts, d.defaultQueryOpts...)

	err := d.uc.Delete(ctx, d.deleteType, search.WithQueryOpts(opts...))
	return "", err
}
