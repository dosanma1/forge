package filter_test

import (
	"testing"
	"time"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/stretchr/testify/assert"
)

type TestType string

const (
	TestTypeOne   TestType = "one"
	TestTypeTwo   TestType = "two"
	TestTypeThree TestType = "three"
)

type fieldFilterValOneOfValidatorTestInput[T comparable] struct {
	validator filter.ValidationFunc
	allowed   []T
	f         filter.FieldFilter[any]
}

func newFieldFilterValidatorValOneOfTestInput[T comparable](
	t *testing.T, filterName string, filterVal any,
	allowed ...T,
) *fieldFilterValOneOfValidatorTestInput[T] {
	t.Helper()

	validate := filter.ValidateValOneOf(allowed...)
	f := filter.NewFieldFilter(filter.OpEq, filterName, filterVal)

	return &fieldFilterValOneOfValidatorTestInput[T]{
		validator: validate,
		f:         f,
		allowed:   allowed,
	}
}

func TestFieldFilterValidatorValOneOf(t *testing.T) {
	t.Run("values within allowed in the set", func(t *testing.T) {
		input := newFieldFilterValidatorValOneOfTestInput(
			t,
			fields.NameKind.String(),
			[]TestType{TestTypeOne},
			TestTypeOne, TestTypeTwo,
		)

		assert.Nil(t, input.validator(input.f))
	})

	t.Run("value not allowed in the set", func(t *testing.T) {
		input := newFieldFilterValidatorValOneOfTestInput(
			t,
			fields.NameKind.String(),
			[]TestType{TestTypeThree},
			TestTypeOne, TestTypeTwo,
		)

		assert.Equal(
			t,
			fields.NewErrWithFieldName(
				filter.FieldNameFilter.Merge(fields.Name(input.f.Name())),
				fields.NewErrInvalid(
					input.f.Value(),
					fields.NewWrappedErr("val: %v is not within allowed set of vals: %v", input.f.Value(), input.allowed),
				),
			),
			input.validator(input.f),
		)
	})

	t.Run("not allowed value", func(t *testing.T) {
		input := newFieldFilterValidatorValOneOfTestInput(
			t,
			fields.NameKind.String(),
			"a",
			"b",
			"c",
		)

		assert.Equal(
			t,
			fields.NewErrWithFieldName(
				filter.FieldNameFilter.Merge(fields.Name(input.f.Name())),
				fields.NewErrInvalid(
					input.f.Value(),
					fields.NewWrappedErr("val: %v is not within allowed set of vals: %v", input.f.Value(), input.allowed),
				),
			),
			input.validator(input.f),
		)
	})

	timeFixture := time.Now().UTC()
	t.Run("value within allowed set", func(t *testing.T) {
		input := newFieldFilterValidatorValOneOfTestInput(
			t,
			fields.NameCreationTime.String(),
			timeFixture,
			timeFixture.Add(-1*time.Second),
			timeFixture,
		)

		assert.Nil(t, input.validator(input.f))
	})
}

func TestFieldFilterValidatorFieldOfType(t *testing.T) {
	t.Run("not allowed value", func(t *testing.T) {
		fName := fields.NameID
		val := uint(1)
		f := filter.GTEq[any](fName.String(), val)

		expectedErr := fields.NewErrWithFieldName(
			filter.FieldNameFilter.Merge(fName),
			fields.NewErrInvalid(
				val,
				fields.NewWrappedErr("invalid type for field: %v; type: %T", fName, val),
			),
		)

		assert.Equal(t,
			expectedErr,
			filter.ValidateTyped[string](f),
		)
	})

	t.Run("allowed value", func(t *testing.T) {
		fName := fields.NameUpdatedTime
		val := time.Now().UTC()
		f := filter.Like[any](fName.String(), val)

		assert.Nil(t, filter.ValidateTyped[time.Time](f))
	})
}

type customTypeWithZeroChecker struct{}

func (ctwzc *customTypeWithZeroChecker) IsZero() bool {
	return ctwzc == nil
}

func TestFieldValidateNotZero(t *testing.T) {
	var custom *customTypeWithZeroChecker

	tests := map[string]struct {
		val        any
		filterName fields.Name
		mustErr    bool
	}{
		"zero val for number": {
			val:        0,
			filterName: fields.NameID,
			mustErr:    true,
		},
		"zero val for string": {
			val:        "",
			filterName: fields.NameName,
			mustErr:    true,
		},
		"empty string array": {
			val:        []string{},
			filterName: fields.NameClient,
			mustErr:    true,
		},
		"string array with empty val": {
			val:        []string{"123", ""},
			filterName: fields.NameConfig,
			mustErr:    true,
		},
		"custom type empty zero val": {
			val:        custom,
			filterName: fields.NameConfig,
			mustErr:    true,
		},
		"not zero": {
			val:        time.Now().UTC(),
			filterName: fields.NameCreationTime,
			mustErr:    false,
		},
		"enum slice is zero": {
			val:        []TestType{},
			filterName: fields.NameKind,
			mustErr:    true,
		},
		"enum slice is not zero": {
			val:        []TestType{TestTypeOne},
			filterName: fields.NameKind,
			mustErr:    false,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			f := filter.LTEq(test.filterName.String(), test.val)

			out := filter.ValidateNotZero(f)
			if test.mustErr {
				expErr := fields.NewErrWithFieldName(
					filter.FieldNameFilter.Merge(fields.Name(f.Name())),
					fields.NewErrInvalid(
						f.Value(),
						fields.NewErrZeroVal(fields.Name(f.Name()), f.Value()),
					),
				)
				assert.Equal(
					t,
					out,
					expErr,
				)
			} else {
				assert.Nil(t, out)
			}
		})
	}
}

func TestAllValid(t *testing.T) {
	fieldFilter := filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), "")

	tests := []struct {
		name    string
		in      []filter.ValidationFunc
		wantErr bool
	}{
		{
			name: "one validation failing",
			in: []filter.ValidationFunc{
				filter.ValidateTyped[string],
				filter.ValidateValOneOf(""),
				filter.ValidateNotZero,
			},
			wantErr: true,
		},
		{
			name: "all validations pass",
			in: []filter.ValidationFunc{
				filter.ValidateTyped[string],
				filter.ValidateValOneOf(""),
			},
			wantErr: false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			valFunc := filter.AllValid(test.in...)
			gotErr := valFunc(fieldFilter)
			if test.wantErr {
				assert.NotNil(t, gotErr)
			} else {
				assert.Nil(t, gotErr)
			}
		})
	}
}

func TestAnyValid(t *testing.T) {
	fieldFilter := filter.NewFieldFilter[any](
		filter.OpEq, fields.NameCreationTime.String(), time.Time{},
	)

	tests := []struct {
		name    string
		in      []filter.ValidationFunc
		wantErr bool
	}{
		{
			name: "all validations fail",
			in: []filter.ValidationFunc{
				filter.ValidateTyped[int],
				filter.ValidateValOneOf(time.Now().UTC()),
			},
			wantErr: true,
		},
		{
			name: "one validation passes",
			in: []filter.ValidationFunc{
				filter.ValidateTyped[string],
				filter.ValidateNotZero,
				filter.ValidateValOneOf(time.Time{}),
			},
			wantErr: false,
		},
		{
			name: "all validations pass",
			in: []filter.ValidationFunc{
				filter.ValidateTyped[time.Time],
				filter.ValidateValOneOf(time.Time{}),
			},
			wantErr: false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			valFunc := filter.AnyValid(test.in...)
			gotErr := valFunc(fieldFilter)
			if test.wantErr {
				assert.NotNil(t, gotErr)
			} else {
				assert.Nil(t, gotErr)
			}
		})
	}
}

func TestValidateTyped(t *testing.T) {
	tests := []struct {
		name    string
		in      filter.FieldFilter[any]
		wantErr error
	}{
		{
			name:    "if value is not a string, return error",
			in:      filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), 1),
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), 1),
		},
		{
			name:    "if value is an array of strings, return error",
			in:      filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), []string{"1", "2"}),
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), []string{"1", "2"}),
		},
		{
			name: "if value is a string, return nil",
			in:   filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), "1"),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := filter.ValidateTyped[string](test.in)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}

func TestValidateArrayField(t *testing.T) {
	tests := []struct {
		name    string
		in      filter.FieldFilter[any]
		wantErr error
	}{
		{
			name:    "if value is not a []string, return error",
			in:      filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), "1"),
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), "1"),
		},
		{
			name: "if value is a []string, return nil",
			in:   filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), []string{"1", "2"}),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := filter.ValidateArrayField[string](test.in)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}

func TestValidateArrayOrSingleField(t *testing.T) {
	tests := []struct {
		name    string
		in      filter.FieldFilter[any]
		wantErr error
	}{
		{
			name:    "if value is not a string or []string, return error",
			in:      filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), 1),
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), 1),
		},
		{
			name: "if value is a string, return nil",
			in:   filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), "1"),
		},
		{
			name: "if value is a []string, return nil",
			in:   filter.NewFieldFilter[any](filter.OpEq, fields.NameID.String(), []string{"1", "2"}),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := filter.ValidateArrayOrSingleField[string](test.in)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}

//nolint:dupl // false positive
func TestValidateIntegerString(t *testing.T) {
	tests := []struct {
		name    string
		in      any
		wantErr error
	}{
		{
			name:    "if value is not a string or []string, return error",
			in:      1,
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), 1),
		},
		{
			name:    "if values is a string but not an integer, return error",
			in:      "abc",
			wantErr: apierrors.New(apierrors.CodeInvalidFormat),
		},
		{
			name: "if value is a string and can be parsed as an integer, return nil",
			in:   "123",
		},
		{
			name:    "if value is a []string but not all are integers, return error",
			in:      []string{"123", "abc", "456"},
			wantErr: apierrors.New(apierrors.CodeInvalidFormat),
		},
		{
			name: "if value is a []string and all are integers, return nil",
			in:   []string{"123", "456"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			f := filter.NewFieldFilter(filter.OpEq, fields.NameID.String(), test.in)
			err := filter.ValidateIntegerString(f)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}

//nolint:dupl // false positive
func TestValidateUUID(t *testing.T) {
	tests := []struct {
		name    string
		in      any
		wantErr error
	}{
		{
			name:    "if value is not a string or []string, return error",
			in:      1,
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), 1),
		},
		{
			name:    "if values is a string but not a uuid, return error",
			in:      "abc",
			wantErr: apierrors.New(apierrors.CodeInvalidFormat),
		},
		{
			name: "if value is a string and uuid, return nil",
			in:   "c395b1fe-4551-442e-88db-b07fef539337",
		},
		{
			name:    "if value is a []string but not all are uuids, return error",
			in:      []string{"c395b1fe-4551-442e-88db-b07fef539337", "abc", "d039fec7-2aff-48bf-af90-dc6942c7fbf8"},
			wantErr: apierrors.New(apierrors.CodeInvalidFormat),
		},
		{
			name: "if value is a []string and all are uuids, return nil",
			in:   []string{"c395b1fe-4551-442e-88db-b07fef539337", "d039fec7-2aff-48bf-af90-dc6942c7fbf8"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			f := filter.NewFieldFilter(filter.OpEq, fields.NameID.String(), test.in)
			err := filter.ValidateUUID(f)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}

func TestValidateNil(t *testing.T) {
	tests := []struct {
		name    string
		in      any
		wantErr error
	}{
		{
			name:    "if value is not nil, return error",
			in:      "not nil",
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), "not nil"),
		},
		{
			name:    "if value is a number, return error",
			in:      123,
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), 123),
		},
		{
			name:    "if value is an empty string, return error",
			in:      "",
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), ""),
		},
		{
			name:    "if value is an empty slice, return error",
			in:      []string{},
			wantErr: fields.NewWrappedErr("invalid type for field: %v; type: %T", fields.NameID.String(), []string{}),
		},
		{
			name: "if value is nil, return nil",
			in:   nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			f := filter.NewFieldFilter(filter.OpIs, fields.NameID.String(), test.in)
			err := filter.ValidateNil(f)
			assert.ErrorIs(t, err, test.wantErr)
		})
	}
}
