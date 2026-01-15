package fields_test

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/stretchr/testify/assert"
)

func TestMergeFieldNames(t *testing.T) {
	t.Parallel()

	merged := fields.Name("random").Merge("inner").Merge("field")
	expected := "random.inner.field"
	assert.Equal(t, merged.String(), expected)
	assert.Equal(t, merged, fields.Name(expected))
}
