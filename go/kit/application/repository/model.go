package repository

import (
	"maps"
	"slices"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/search"
)

type (
	PatchQuery interface {
		SearchOpts() []search.Option
		PatchFields() map[fields.Name]any
		FilterPatchFields(allow ...fields.Name) map[fields.Name]any
	}

	patchQuery struct {
		patchFields map[fields.Name]any
		searchOpts  []search.Option
	}

	PatchOption func(pq *patchQuery)
)

func NewPatchQuery(opts ...PatchOption) *patchQuery {
	pq := &patchQuery{
		patchFields: make(map[fields.Name]any),
	}
	for _, opt := range opts {
		opt(pq)
	}
	return pq
}

func (pq *patchQuery) SearchOpts() []search.Option {
	return pq.searchOpts
}

func (pq *patchQuery) PatchFields() map[fields.Name]any {
	return pq.patchFields
}

func (pq *patchQuery) PatchFieldsAsOptions() []PatchOption {
	opts := []PatchOption{}
	for fName, fVal := range pq.patchFields {
		opts = append(opts, PatchField(fName, fVal))
	}

	return opts
}

func (pq *patchQuery) PatchFieldExists(fName fields.Name) bool {
	_, exists := pq.patchFields[fName]
	return exists
}

func (pq *patchQuery) FilterPatchFields(allow ...fields.Name) map[fields.Name]any {
	if len(allow) == 0 {
		return pq.patchFields
	}
	filtered := maps.Clone(pq.patchFields)
	for k := range pq.patchFields {
		if !slices.Contains(allow, k) {
			delete(filtered, k)
		}
	}
	return filtered
}

func WithPatchQuery(query PatchQuery) PatchOption {
	return func(pq *patchQuery) {
		pq.searchOpts = query.SearchOpts()
		pq.patchFields = query.PatchFields()
	}
}

func WithPatchQueryOpts(opts ...PatchOption) PatchOption {
	return func(pq *patchQuery) {
		WithPatchQuery(NewPatchQuery(opts...))(pq)
	}
}

func WithPatchFields(patchFields map[fields.Name]any) PatchOption {
	return func(pq *patchQuery) {
		pq.patchFields = patchFields
	}
}

func PatchSearchOpts(opts ...search.Option) PatchOption {
	return func(pq *patchQuery) {
		pq.searchOpts = opts
	}
}

func PatchField(name fields.Name, value any) PatchOption {
	return func(pq *patchQuery) {
		pq.patchFields[name] = value
	}
}
