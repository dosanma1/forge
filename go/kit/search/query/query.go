// Package query ...
package query

import (
	"fmt"
	"reflect"
	"slices"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
)

const (
	FieldNameQuery      fields.Name = "query"
	FieldNamePagination fields.Name = "pagination"
	FieldNameSorting    fields.Name = "sorting"
	FieldNameIncludes   fields.Name = "includes"
)

type SortingDir uint

const (
	SortDirUndefined SortingDir = iota
	SortAsc
	SortDesc
)

func (sd SortingDir) Valid() bool {
	return sd == SortAsc || sd == SortDesc
}

func (sd SortingDir) String() string {
	switch sd {
	case SortAsc:
		return "ASC"
	case SortDesc:
		return "DESC"
	case SortDirUndefined:
		return ""
	default:
		return ""
	}
}

type SortingParams struct {
	m    map[string]SortingDir
	keys []string
}

func newSortingParams() *SortingParams {
	return &SortingParams{
		m:    make(map[string]SortingDir),
		keys: make([]string, 0),
	}
}

func (sp *SortingParams) Set(key string, v SortingDir) {
	_, present := sp.m[key]
	sp.m[key] = v
	if !present {
		sp.keys = append(sp.keys, key)
	}
}

func (sp *SortingParams) Keys() []string {
	return sp.keys
}

func (sp *SortingParams) Get(key string) SortingDir {
	value, present := sp.m[key]
	if !present {
		return SortAsc
	}

	return value
}

type PaginationParams struct {
	Limit  int
	Offset int
}

func (p *PaginationParams) Delete() {
	if p != nil {
		p.Limit = 0
		p.Offset = 0
	}
}

type Filters[T any] map[string]filter.FieldFilter[T]

func (qf Filters[T]) Get(key string) filter.FieldFilter[T] {
	return qf[key]
}

func (qf Filters[T]) Exists(keys ...string) bool {
	if len(keys) < 1 {
		panic("exists called without any keys")
	}
	for _, k := range keys {
		if qf[k] == nil {
			return false
		}
	}
	return true
}

func (qf Filters[T]) Delete(key string) {
	if qf.Exists(key) {
		delete(qf, key)
	}
}

func GetFilterVal[T any](fName fields.Name, filters Filters[any]) T {
	f := filters.Get(fName.String())
	var fVal T
	if f != nil {
		fVal = f.Value().(T)
	}
	return fVal
}

// GetFilterValOrDefault retrieves the value associated with a field name from a set of filters,
// and returns the value if found. If the field filter is not present in the filters, it returns
// the provided default value.
//
// Parameters:
//   - fName: The field name to look up in the filters.
//   - filters: A set of filters, typically associated with a query.
//   - def: The default value to return if the field filter is not found or its value is nil.
//
// Type Parameters:
//   - T: The type of value to retrieve and return.
//
// Returns:
//   - T: The value associated with the field name, or the default value if not found or nil.
func GetFilterValOrDefault[T any](fName fields.Name, filters Filters[any], def T) T {
	f := filters.Get(fName.String())
	if f != nil {
		return f.Value().(T)
	}
	return def
}

func GetFilterSingleOrArrayVal[T any](fName fields.Name, filters Filters[any]) []T {
	f := filters.Get(fName.String())
	if f == nil {
		return []T{}
	}

	switch f.Operator() {
	case filter.OpIn:
		if arrayVal, ok := f.Value().([]T); ok {
			return arrayVal
		}
		fallthrough
	case filter.OpEq:
		if singleVal, ok := f.Value().(T); ok {
			return []T{singleVal}
		}
		fallthrough
	default:
		return []T{}
	}
}

func DoesInclude(q Query, relationship fields.Name) bool {
	return slices.Contains(q.IncludedResourceObjects(), relationship)
}

func AddFilter(q Query, operator filter.Operator, name fields.Name, val any) {
	if q.Filters().Exists(name.String()) {
		return
	}
	q.Filters()[name.String()] = filter.NewFieldFilter(operator, name.String(), val)
}

func UpdateFilter[T any](q Query, name fields.Name, updateFunc func(filter.Operator, T) (filter.Operator, string, any)) {
	if !q.Filters().Exists(name.String()) {
		return
	}
	f := q.Filters()[name.String()]
	v, ok := f.Value().(T)
	if !ok {
		return
	}
	q.Filters()[name.String()] = filter.NewFieldFilter(updateFunc(f.Operator(), v))
}

type Query interface {
	Filters() Filters[any]
	Sorting() *SortingParams
	Merge(q Query)
	Pagination() *PaginationParams
	IncludedResourceObjects() []fields.Name
	Equal(another Query) bool
}

type Option func(q *query)

func sortBy(key string, dir SortingDir) Option {
	return func(q *query) {
		if len(key) < 1 {
			return
		}
		if !dir.Valid() {
			return
		}
		q.sortingParams.Set(key, dir)
	}
}

func SortBy(sortParams ...any) Option {
	return func(q *query) {
		for i := 0; i < len(sortParams); i += 2 {
			if i+1 >= len(sortParams) {
				break
			}

			key, ok := sortParams[i].(string)
			if !ok {
				fmtKey, keyCast := sortParams[i].(fmt.Stringer)
				if !keyCast || fmtKey == nil {
					continue
				}
				key = fmtKey.String()
			}
			dir, dirCast := sortParams[i+1].(SortingDir)
			if !dirCast {
				continue
			}

			sortBy(key, dir)(q)
		}
	}
}

func Filter(f filter.FieldFilter[any]) Option {
	return func(q *query) {
		if f == nil {
			return
		}
		q.filters[f.Name()] = f
	}
}

func FilterBy(op filter.Operator, fieldName, val any) Option {
	return func(q *query) {
		if !op.Valid() {
			return
		}
		name, nameCast := fieldName.(string)
		if !nameCast {
			fmtName, nameCast := fieldName.(fmt.Stringer)
			if !nameCast || fmtName == nil {
				return
			}
			name = fmtName.String()
		}
		if len(name) < 1 {
			return
		}
		if val == nil && op != filter.OpIs && op != filter.OpIsNot {
			return
		}
		q.filters[name] = filter.NewFieldFilter(op, name, val)
	}
}

func FilterByTriples(opFieldVals ...any) Option {
	return func(q *query) {
		for i := 0; i < len(opFieldVals); i += 3 {
			if i+2 >= len(opFieldVals) {
				break
			}

			op, opCast := opFieldVals[i].(filter.Operator)
			if !opCast {
				continue
			}

			FilterBy(op, opFieldVals[i+1], opFieldVals[i+2])(q)
		}
	}
}

func Pagination(limit, offset int) Option {
	return func(q *query) {
		q.pagination = &PaginationParams{
			Limit:  limit,
			Offset: offset,
		}
	}
}

func IncludedResourceObjects(relationshipNames ...fields.Name) Option {
	return func(q *query) {
		q.includedResourceObjects = append(q.includedResourceObjects, relationshipNames...)
	}
}

type query struct {
	filters                 map[string]filter.FieldFilter[any]
	sortingParams           *SortingParams
	pagination              *PaginationParams
	includedResourceObjects []fields.Name
}

func (q *query) Filters() Filters[any] {
	return q.filters
}

func (q *query) Sorting() *SortingParams {
	return q.sortingParams
}

func (q *query) Merge(m Query) {
	if m != nil {
		q.mergeFilters(m.Filters())
		q.mergeSorting(m.Sorting())
		if m.Pagination() != nil {
			q.pagination = m.Pagination()
		}
		if m.IncludedResourceObjects() != nil {
			q.includedResourceObjects = m.IncludedResourceObjects()
		}
	}
}

func (q *query) Pagination() *PaginationParams {
	return q.pagination
}

func (q *query) IncludedResourceObjects() []fields.Name {
	return q.includedResourceObjects
}

func (q *query) mergeFilters(filters Filters[any]) {
	for _, f := range filters {
		if f.Value() == nil && f.Operator() != filter.OpIs && f.Operator() != filter.OpIsNot {
			continue
		}
		q.filters[f.Name()] = f
	}
}

func (q *query) mergeSorting(sortParams *SortingParams) {
	for _, key := range sortParams.Keys() {
		if len(key) < 1 {
			continue
		}
		dir := sortParams.Get(key)
		if len(key) < 1 || !dir.Valid() {
			continue
		}
		q.sortingParams.Set(key, dir)
	}
}

func (q *query) Equal(another Query) bool {
	if (q == nil && another != nil) ||
		q != nil && another == nil {
		return false
	}
	if q == nil && another == nil {
		return true
	}

	return reflect.DeepEqual(q, another.(*query))
}

// New creates a new query with the provided options.
//
// Parameters:
//   - opts: Optional functional options to configure the query.
//
// Returns:
//   - Query: A new query instance configured with the specified options.
//
// Example Usage:
//
//	opts := SortBy("field1", SortAsc, "field2", SortDesc)
//	myQuery := New(opts...)
func New(opts ...Option) Query {
	q := &query{
		filters:       make(map[string]filter.FieldFilter[any]),
		sortingParams: newSortingParams(),
	}

	for _, opt := range opts {
		opt(q)
	}

	return q
}
