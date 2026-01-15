package filter

import (
	"reflect"
	"slices"
	"time"

	"github.com/dosanma1/forge/go/kit/fields"
)

type ValidationFunc func(f FieldFilter[any]) error

func AllValid(fs ...ValidationFunc) ValidationFunc {
	return func(f FieldFilter[any]) error {
		for _, fv := range fs {
			err := fv(f)
			if err != nil {
				return err
			}
		}

		return nil
	}
}

func AnyValid(fs ...ValidationFunc) ValidationFunc {
	return func(f FieldFilter[any]) error {
		var err error
		for _, fv := range fs {
			err = fv(f)
			if err == nil {
				break
			}
		}

		return err
	}
}

func ValidateValOneOf[T comparable](allowedVals ...T) ValidationFunc {
	return func(f FieldFilter[any]) error {
		switch reflect.ValueOf(f.Value()).Kind() {
		case reflect.Slice, reflect.Array:
			return validateSliceOneOf(f, allowedVals...)
		default:
			return validateSingleOneOf(f, allowedVals...)
		}
	}
}

func validateSliceOneOf[T comparable](f FieldFilter[any], allowedVals ...T) error {
	if values, ok := f.Value().([]T); ok {
		for _, v := range values {
			if !slices.Contains(allowedVals, v) {
				return newInvalidFieldFilterValErr(f, allowedVals...)
			}
		}
		return nil
	}

	if strValues, ok := f.Value().([]string); ok {
		return validateStringSliceConversion(f, strValues, allowedVals...)
	}

	return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
}

func validateSingleOneOf[T comparable](f FieldFilter[any], allowedVals ...T) error {
	if value, ok := f.Value().(T); ok {
		if !slices.Contains(allowedVals, value) {
			return newInvalidFieldFilterValErr(f, allowedVals...)
		}
		return nil
	}

	if strValue, ok := f.Value().(string); ok {
		return validateStringConversion(f, strValue, allowedVals...)
	}

	return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
}

func validateStringSliceConversion[T comparable](f FieldFilter[any], strValues []string, allowedVals ...T) error {
	var zeroVal T
	enumType := reflect.TypeOf(zeroVal)

	if enumType.Kind() == reflect.String {
		for _, strVal := range strValues {
			convertedVal := reflect.ValueOf(strVal).Convert(enumType).Interface().(T)
			if !slices.Contains(allowedVals, convertedVal) {
				return newInvalidFieldFilterValErr(f, allowedVals...)
			}
		}
		return nil
	}

	return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
}

func validateStringConversion[T comparable](f FieldFilter[any], strValue string, allowedVals ...T) error {
	var zeroVal T
	enumType := reflect.TypeOf(zeroVal)

	if enumType.Kind() == reflect.String {
		convertedVal := reflect.ValueOf(strValue).Convert(enumType).Interface().(T)
		if !slices.Contains(allowedVals, convertedVal) {
			return newInvalidFieldFilterValErr(f, allowedVals...)
		}
		return nil
	}

	return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
}

func ValidateTyped[T any](f FieldFilter[any]) error {
	_, ok := f.Value().(T)
	if !ok {
		return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
	}

	return nil
}

func newErrInvalidFilterTypeErr(val any, field fields.Name) error {
	fName := FieldNameFilter.Merge(field)
	return fields.NewErrWithFieldName(
		fName,
		fields.NewErrInvalid(
			val,
			fields.NewWrappedErr("invalid type for field: %v; type: %T", field, val),
		),
	)
}

func newInvalidFieldFilterValErr[T any](f FieldFilter[any], allowed ...T) error {
	fName := FieldNameFilter.Merge(fields.Name(f.Name()))
	return fields.NewErrWithFieldName(
		fName,
		fields.NewErrInvalid(
			f.Value(),
			fields.NewWrappedErr("val: %v is not within allowed set of vals: %v", f.Value(), allowed),
		),
	)
}

func ValidateNotZero(f FieldFilter[any]) error {
	switch v := f.Value().(type) {
	case uint, uint8, uint16, uint32, uint64,
		int, int8, int16, int32, int64,
		float32, float64:
		if v == 0 {
			return newErrInvalidFilterZeroValErr(f)
		}
	case string:
		if len(v) < 1 {
			return newErrInvalidFilterZeroValErr(f)
		}
	case []string:
		if len(v) < 1 {
			return newErrInvalidFilterZeroValErr(f)
		}
		for _, val := range v {
			if len(val) < 1 {
				return newErrInvalidFilterZeroValErr(f)
			}
		}
	case fields.IsZeroChecker:
		if v.IsZero() {
			return newErrInvalidFilterZeroValErr(f)
		}
	default:
		val := reflect.ValueOf(f.Value())
		//nolint:exhaustive // we only need to check for slices
		switch val.Kind() {
		case reflect.Slice, reflect.Array:
			if val.Len() < 1 {
				return newErrInvalidFilterZeroValErr(f)
			}
		}
	}

	return nil
}

func newErrInvalidFilterZeroValErr(f FieldFilter[any]) error {
	fName := FieldNameFilter.Merge(fields.Name(f.Name()))
	return fields.NewErrWithFieldName(
		fName,
		fields.NewErrInvalid(
			f.Value(),
			fields.NewErrZeroVal(fields.Name(f.Name()), f.Value()),
		),
	)
}

func ValidateArrayField[T any](f FieldFilter[any]) error {
	switch reflect.ValueOf(f.Value()).Kind() {
	case reflect.Slice, reflect.Array:
		if _, ok := f.Value().([]T); !ok {
			return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
		}
	default:
		return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
	}
	return nil
}

func ValidateArrayOrSingleField[T any](f FieldFilter[any]) error {
	return AnyValid(ValidateTyped[T], ValidateArrayField[T])(f)
}

func ValidateDateString(f FieldFilter[any]) error {
	if err := fields.TimeFmtValidator(fields.Name(f.Name()), time.DateOnly)(f.Value().(string)); err != nil {
		return err
	}
	return nil
}

//nolint:dupl // false positive
func ValidateIntegerString(f FieldFilter[any]) error {
	switch f.Value().(type) {
	case string:
		if err := fields.IntValidator(fields.Name(f.Name()))(f.Value().(string)); err != nil {
			return err
		}
	case []string:
		for _, val := range f.Value().([]string) {
			if err := fields.IntValidator(fields.Name(f.Name()))(val); err != nil {
				return err
			}
		}
	default:
		return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
	}
	return nil
}

//nolint:dupl // false positive
func ValidateUUID(f FieldFilter[any]) error {
	switch f.Value().(type) {
	case string:
		if err := fields.UUIDValidator(fields.Name(f.Name()))(f.Value().(string)); err != nil {
			return err
		}
	case []string:
		for _, val := range f.Value().([]string) {
			if err := fields.UUIDValidator(fields.Name(f.Name()))(val); err != nil {
				return err
			}
		}
	default:
		return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
	}

	return nil
}

func ValidateNil(f FieldFilter[any]) error {
	if f.Value() != nil {
		return newErrInvalidFilterTypeErr(f.Value(), fields.Name(f.Name()))
	}
	return nil
}
