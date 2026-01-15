package fields

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"time"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/generics"
	"github.com/google/uuid"
)

func ValidateAny[T any](v any, validator Validator[T]) error {
	val, ok := v.(T)
	if !ok {
		return apierrors.InvalidFormat("field", v, reflect.TypeOf((*T)(nil)).Elem().String())
	}
	return validator(val)
}

type Validator[T any] func(T) error

func NotZeroValidator[T comparable](fName Name) Validator[T] {
	return func(val T) error {
		zero := generics.Zero[T]()

		if val != zero {
			return nil
		}

		return apierrors.ValidationFailed(string(fName))
	}
}

func ZeroValidator[T interface{ IsZero() bool }](fName Name) Validator[T] {
	return func(val T) error {
		if val.IsZero() {
			return nil
		}

		return apierrors.ValidationFailed(string(fName))
	}
}

func NotLtIntValidator[T int | uint](fName Name, value T) Validator[T] {
	return func(val T) error {
		if val <= value {
			return apierrors.ValidationFailed(string(fName))
		}
		return nil
	}
}

func EmptyStringValidator(fName Name) Validator[string] {
	return func(val string) error {
		if val != "" {
			return apierrors.ValidationFailed(string(fName))
		}
		return nil
	}
}

func NotEmptyStringValidator(fName Name) Validator[string] {
	return func(val string) error {
		if len(val) < 1 {
			return apierrors.MissingField(string(fName))
		}
		return nil
	}
}

func RegexpValidator(fName Name, matchPattern string) Validator[string] {
	return func(val string) error {
		match, err := regexp.MatchString(matchPattern, val)
		if err != nil {
			return apierrors.InvalidFormat(string(fName), val, matchPattern)
		}
		if !match {
			return apierrors.InvalidFormat(string(fName), val, matchPattern)
		}
		return nil
	}
}

func UUIDValidator(fName Name) Validator[string] {
	return func(s string) error {
		_, err := uuid.Parse(s)
		if err != nil {
			return apierrors.InvalidFormat(string(fName), s, "UUID")
		}

		return nil
	}
}

func NotNilValidator(fName Name) Validator[any] {
	return func(val any) error {
		if IsNil(val) {
			return apierrors.MissingField(string(fName))
		}

		return nil
	}
}

func NilValidator(fName Name) Validator[any] {
	return func(val any) error {
		if !IsNil(val) {
			return apierrors.ValidationFailed(string(fName))
		}

		return nil
	}
}

func IsNil(val any) bool {
	if val == nil {
		return true
	}
	//nolint:exhaustive // other cases are handled before the switch
	switch reflect.TypeOf(val).Kind() {
	case reflect.Ptr, reflect.Map, reflect.Array, reflect.Chan, reflect.Slice:
		if reflect.ValueOf(val).IsNil() {
			return true
		}
	}
	return false
}

func EnumValidator(fName Name, allowedVals ...fmt.Stringer) Validator[fmt.Stringer] {
	return func(s fmt.Stringer) error {
		for _, allowed := range allowedVals {
			if s.String() == allowed.String() {
				return nil
			}
		}
		return apierrors.InvalidArgument(string(fName))
	}
}

func IotaEnumValidator(fName Name, allowedVals ...uint) Validator[uint] {
	return func(s uint) error {
		for _, allowed := range allowedVals {
			if s == allowed {
				return nil
			}
		}
		return apierrors.InvalidArgument(string(fName))
	}
}

func IntValidator(fName Name) Validator[string] {
	return func(s string) error {
		_, err := strconv.Atoi(s)
		if err != nil {
			return apierrors.InvalidFormat(string(fName), s, "integer")
		}
		return nil
	}
}

func NotEmptySliceValidator[T any](fName Name) Validator[[]T] {
	return func(val []T) error {
		if len(val) < 1 {
			return apierrors.MissingField(string(fName))
		}
		return nil
	}
}

func SliceValidator[T any](validator Validator[T]) Validator[[]T] {
	return func(t []T) error {
		for _, v := range t {
			if err := validator(v); err != nil {
				return err
			}
		}
		return nil
	}
}

func TimeFmtValidator(fName Name, dateFmt string) Validator[string] {
	return func(s string) error {
		_, err := time.Parse(dateFmt, s)
		if err != nil {
			return apierrors.InvalidFormat(string(fName), s, dateFmt)
		}
		return nil
	}
}
