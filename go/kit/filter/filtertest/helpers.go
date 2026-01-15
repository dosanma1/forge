package filtertest

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/stretchr/testify/assert"
)

func AssertField(t *testing.T, expected, actual filter.Field[any]) {
	t.Helper()
	if expected == nil {
		assert.Nil(t, actual)
		return
	}

	assert.Equal(t, expected.Name(), actual.Name())
	assert.Equal(t, expected.Value(), actual.Value())
}

func AssertFilter(t *testing.T, expected, actual filter.FieldFilter[any]) {
	t.Helper()
	if expected == nil {
		assert.Nil(t, actual)
		return
	}

	AssertField(t, expected, actual)
	assert.Equal(t, expected.Operator(), actual.Operator())
}
