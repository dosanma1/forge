package filter_test

import (
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/stretchr/testify/assert"
)

func TestUndefinedOpStringsAsEmpty(t *testing.T) {
	assert.Equal(t, "", filter.OpUndefined.String())
}

func TestInvalidFieldFilters(t *testing.T) {
	type testInput struct {
		name string
		val  any
		op   filter.Operator
	}

	tests := map[string]testInput{
		"empty name": {
			name: "",
			val:  "aval",
			op:   filter.OpEq,
		},
		"invalid operator": {
			name: "onename",
			val:  "onenameval",
			op:   filter.OpUndefined,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Panics(t,
				func() {
					filter.NewFieldFilter(test.op, test.name, test.val)
				},
			)
		})
	}
}

type filterGenFuncExpect struct {
	op   filter.Operator
	name string
	val  any
}

func filterMatchesExpect[T any](
	t *testing.T,
	fieldFilter filter.FieldFilter[T], exp *filterGenFuncExpect,
) {
	t.Helper()

	assert.Equal(t, exp.op, fieldFilter.Operator())
	assert.Equal(t, exp.name, fieldFilter.Name())
	assert.Equal(t, exp.val, fieldFilter.Value())
}

func TestSliceFieldFilterGenFuncs(t *testing.T) {
	cTime := time.Now().UTC()

	tests := map[string]struct {
		input func() filter.FieldFilter[[]any]
		out   filterGenFuncExpect
	}{
		"in": {
			input: func() filter.FieldFilter[[]any] {
				return filter.In[any]("c", cTime)
			},
			out: filterGenFuncExpect{
				op:   filter.OpIn,
				name: "c",
				val:  []any{cTime},
			},
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			fieldFilter := test.input()

			filterMatchesExpect(t, fieldFilter, &test.out)
		})
	}
}

func TestFieldFilterGenFuncs(t *testing.T) {
	tests := map[string]struct {
		input func() filter.FieldFilter[any]
		out   filterGenFuncExpect
	}{
		"eq": {
			input: func() filter.FieldFilter[any] {
				return filter.Eq[any]("a", "aval")
			},
			out: filterGenFuncExpect{
				op:   filter.OpEq,
				name: "a",
				val:  "aval",
			},
		},
		"gteq": {
			input: func() filter.FieldFilter[any] {
				return filter.GTEq[any]("b", "bval")
			},
			out: filterGenFuncExpect{
				op:   filter.OpGTEq,
				name: "b",
				val:  "bval",
			},
		},
		"lteq": {
			input: func() filter.FieldFilter[any] {
				return filter.LTEq[any]("c", float32(2.0))
			},
			out: filterGenFuncExpect{
				op:   filter.OpLTEq,
				name: "c",
				val:  float32(2.0),
			},
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			fieldFilter := test.input()

			filterMatchesExpect(t, fieldFilter, &test.out)
		})
	}
}

func TestUpdate(t *testing.T) {
	inVal := uint(10)
	updateVal := uint(30)

	f := filter.NewFieldFilter(filter.OpEq, fields.NameID.String(), inVal)
	assert.Equal(t, f.Value(), inVal)
	f.Update(updateVal)
	assert.Equal(t, f.Value(), updateVal)
}
