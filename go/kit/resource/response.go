package resource

import (
	"github.com/dosanma1/forge/go/kit/jsonapi"
)

type ListResponse[T Resource] interface {
	jsonapi.ListResponse[T]
	TotalCount() int
}

type listRes[T Resource] struct {
	items []T
	count int
}

func (lr *listRes[T]) Results() []T {
	return lr.items
}

func (lr *listRes[T]) TotalCount() int {
	return lr.count
}

func NewEmptyListResponse[T Resource]() *listRes[T] {
	return &listRes[T]{
		items: []T{},
		count: 0,
	}
}

func NewListResponse[T Resource](items []T, count int) *listRes[T] {
	return &listRes[T]{
		items: items,
		count: count,
	}
}
