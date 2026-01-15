package querytest

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/filter/filtertest"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/stretchr/testify/assert"
)

const (
	defaultPageLimit  = 3
	defaultPageOffset = 0
)

func DefaultPagination() query.Option {
	return query.Pagination(defaultPageLimit, defaultPageOffset)
}

func AssertFilters(t *testing.T, expected, actual query.Filters[any]) {
	t.Helper()
	assert.Len(t, actual, len(expected))
	for key, val := range expected {
		filtertest.AssertFilter(t, val, actual.Get(key))
	}
}
