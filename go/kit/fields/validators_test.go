package fields_test

import (
	"errors"
	"testing"
	"time"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type EnumTest string

func (t EnumTest) String() string {
	return string(t)
}

const FieldNameTest fields.Name = "test"

func Test_NotEmptyStringValidator(t *testing.T) {
	t.Parallel()

	v := fields.NotEmptyStringValidator(FieldNameTest)
	assert.ErrorIs(t, v(""), apierrors.New(apierrors.CodeMissingField))
	assert.Nil(t, v("test"))
}

func Test_RegexpValidator(t *testing.T) {
	regExp := "[0-9]"
	t.Run("valid regexp, return nil", func(t *testing.T) {
		err := fields.RegexpValidator(FieldNameTest, regExp)("0")
		assert.NoError(t, err)
	})

	t.Run("valid regexp and invalid value, return error", func(t *testing.T) {
		err := fields.RegexpValidator(FieldNameTest, regExp)("a")
		assert.ErrorIs(t, err, apierrors.New(apierrors.CodeInvalidFormat))
	})
}

func Test_UUIDValidator(t *testing.T) {
	t.Run("valid uuid, return nil", func(t *testing.T) {
		err := fields.UUIDValidator(FieldNameTest)(uuid.NewString())
		assert.NoError(t, err)
	})

	t.Run("invalid uuid, return error", func(t *testing.T) {
		err := fields.UUIDValidator(FieldNameTest)("")
		assert.ErrorIs(t, err, apierrors.New(apierrors.CodeInvalidFormat))
	})
}

type customType struct{}

func Test_NotNilValidatorErr(t *testing.T) {
	t.Parallel()

	type input struct {
		fieldName fields.Name
		val       any
	}

	tests := map[string]struct {
		in     input
		expErr bool
	}{
		"nil val": {
			in: input{
				fieldName: FieldNameTest,
				val:       nil,
			},
			expErr: true,
		},
		"nil pointer to custom type": {
			in: input{
				fieldName: fields.NameID,
				val: func() any {
					var v *customType
					return v
				}(),
			},
			expErr: true,
		},
		"not nil": {
			in: input{
				fieldName: fields.NameCreationTime,
				val:       time.Now().UTC(),
			},
			expErr: false,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			out := fields.NotNilValidator(test.in.fieldName)(test.in.val)

			if test.expErr {
				assert.ErrorIs(t, out, apierrors.New(apierrors.CodeMissingField))
			} else {
				assert.Nil(t, out)
			}
		})
	}
}

func Test_EnumValidator(t *testing.T) {
	t.Parallel()

	v := fields.EnumValidator(FieldNameTest, EnumTest("test"))
	err := v(EnumTest("test_test"))
	require.Error(t, err)

	// Check that it returns an InvalidArgument error
	var apiErr apierrors.Error
	if errors.As(err, &apiErr) {
		assert.Equal(t, "INVALID_ARGUMENT", string(apiErr.Code()))
	} else {
		t.Errorf("Error does not implement apierrors.Error interface: %T", err)
	}

	assert.Nil(t, v(EnumTest("test")))
}

func Test_IntValidator(t *testing.T) {
	t.Parallel()

	v := fields.IntValidator(FieldNameTest)
	assert.Nil(t, v("0"))
	assert.Error(t, v("not an integer"))
}

func Test_NotEmptySliceValidator(t *testing.T) {
	t.Parallel()

	v := fields.NotEmptySliceValidator[any](FieldNameTest)
	assert.ErrorIs(t, v([]any{}), apierrors.New(apierrors.CodeMissingField))
	assert.Nil(t, v([]any{1}))
}

func Test_SliceValidator(t *testing.T) {
	errVal := func(err error) error {
		return err
	}

	t.Run("no errors in slice, return nil", func(t *testing.T) {
		err := fields.SliceValidator(errVal)([]error{nil, nil, nil})
		assert.NoError(t, err)
	})

	t.Run("error in slice, return error", func(t *testing.T) {
		expected := fields.NewWrappedErr("test error")
		err := fields.SliceValidator(errVal)([]error{nil, expected, nil})
		assert.ErrorIs(t, err, expected)
	})
}
