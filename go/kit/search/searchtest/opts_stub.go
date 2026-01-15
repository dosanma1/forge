package searchtest

import (
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

func AnyOpts() []search.Option {
	return []search.Option{
		search.WithQueryOpts(query.FilterBy(filter.OpEq, fields.NameID, "id")),
	}
}
