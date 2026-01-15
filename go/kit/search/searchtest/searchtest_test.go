package searchtest_test

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/search/searchtest"
)

func TestOptsHelpers(t *testing.T) {
	tests := []struct {
		name      string
		one       []search.Option
		another   []search.Option
		mustEqual bool
	}{
		{
			name: "both empty", mustEqual: true,
			one: []search.Option{}, another: []search.Option{},
		},
		{
			name: "both nil", mustEqual: true,
			one: nil, another: nil,
		},
		{
			name: "one with query, another without", mustEqual: false,
			one: []search.Option{}, another: []search.Option{search.WithQuery(query.New())},
		},
		{
			name: "single opt, different args", mustEqual: false,
			one: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortDesc),
				),
			},
			another: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortAsc),
				),
			},
		},
		{
			name: "single opt, same args", mustEqual: true,
			one: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortDesc),
				),
			},
			another: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortDesc),
				),
			},
		},
		{
			name: "different opt count, first same args", mustEqual: false,
			one: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortDesc),
				),
			},
			another: []search.Option{
				search.WithQueryOpts(
					query.SortBy(fields.NameCreationTime, query.SortDesc),
				),
				search.WithQueryOpts(
					query.SortBy(fields.NameUpdatedTime, query.SortAsc),
				),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.mustEqual {
				searchtest.OptsEqual(t, test.one, test.another)
			} else {
				searchtest.OptsDiff(t, test.one, test.another)
			}
		})
	}
}
