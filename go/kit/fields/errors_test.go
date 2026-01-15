package fields_test

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/stretchr/testify/assert"
)

func TestErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		err         error
		errContains []string
	}{
		{
			name: "invalid nil field",
			err: fields.NewErrInvalidNil(
				fields.NameUsecase,
			),
			errContains: []string{
				"empty field", "usecase",
			},
		},
		{
			name: "zero val",
			err: fields.NewErrZeroVal(
				fields.NameUsecase.Merge(fields.NameID),
				"",
			),
			errContains: []string{
				"empty field", "usecase.id", "error in field", "; err: ",
				"(field type: string)",
			},
		},
	}

	for _, ts := range tests {
		test := ts
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			for _, contains := range test.errContains {
				assert.Contains(
					t,
					test.err.Error(),
					contains,
				)
			}
		})
	}

	nilErr := fields.NewErrNil(fields.NameUsecase.Merge(fields.NameID))

	errEmptyField := new(fields.ErrEmpty)
	assert.ErrorAs(t, nilErr, errEmptyField)
	assert.False(t, errEmptyField.IsZero())
	assert.True(t, errEmptyField.IsNil())

	errWithFieldName := new(fields.ErrWithFieldName)
	assert.ErrorAs(t, nilErr, errWithFieldName)
	assert.Equal(t,
		errWithFieldName.FieldName(),
		fields.NameUsecase.Merge(fields.NameID),
	)

	emptyStringErr := fields.NewErrInvalidEmptyString(fields.NameID)

	errEmpty := new(fields.ErrEmpty)
	assert.ErrorAs(t, emptyStringErr, errEmpty)
	assert.True(t, errEmpty.IsZero())
	assert.False(t, errEmpty.IsNil())

	invalidFieldErr := new(fields.ErrInvalid)
	assert.ErrorAs(t, emptyStringErr, invalidFieldErr)
	assert.Equal(t, invalidFieldErr.FieldValue(), "")
}
