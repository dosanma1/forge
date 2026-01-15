// Package querytest provides test helpers for query options
package querytest

import (
	"reflect"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type AnyMatcher func(any) func(any) bool

func ToAnyMatcher[T any](matcher func(T) func(T) bool) AnyMatcher {
	return func(a any) func(any) bool {
		return func(b any) bool {
			aTyped, ok := a.(T)
			if !ok {
				return false
			}
			bTyped, ok := b.(T)
			if !ok {
				return false
			}
			return matcher(aTyped)(bTyped)
		}
	}
}

func OptMatcherFunc(want ...query.Option) func([]query.Option) bool {
	return func(got []query.Option) bool {
		q1 := query.New(want...)
		q2 := query.New(got...)
		return reflect.DeepEqual(q1, q2)
	}
}

func OptMatcherFuncCustomMatchers(want []query.Option, matchers map[fields.Name]AnyMatcher) func([]query.Option) bool {
	return func(got []query.Option) bool {
		wantQuery := query.New(want...)
		gotQuery := query.New(got...)

		for field, matcher := range matchers {
			if !wantQuery.Filters().Exists(field.String()) || !gotQuery.Filters().Exists(field.String()) {
				return false
			}

			if !matcher(wantQuery.Filters().Get(field.String()).Value())(gotQuery.Filters().Get(field.String()).Value()) {
				return false
			}
			wantQuery.Filters().Delete(field.String())
			gotQuery.Filters().Delete(field.String())
		}

		return reflect.DeepEqual(wantQuery, gotQuery)
	}
}
