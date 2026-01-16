package filter

import (
	"fmt"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/google/uuid"
)

func ValidateUUID(f FieldFilter[any]) error {
	val := f.Value()
	switch v := val.(type) {
	case string:
		if _, err := uuid.Parse(v); err != nil {
			return errors.InvalidArgument(fmt.Sprintf("invalid UUID for field %s", f.Name()))
		}
	case []string:
		for _, id := range v {
			if _, err := uuid.Parse(id); err != nil {
				return errors.InvalidArgument(fmt.Sprintf("invalid UUID in list for field %s", f.Name()))
			}
		}
	default:
		// Attempt to convert to string if possible, or fail
		s := fmt.Sprintf("%v", v)
		if _, err := uuid.Parse(s); err != nil {
			return errors.InvalidArgument(fmt.Sprintf("invalid value type for field %s, expected UUID", f.Name()))
		}
	}
	return nil
}

func ValidateArrayOrSingleField[T any](f FieldFilter[any]) error {
	// This acts as a type check
	val := f.Value()
	switch val.(type) {
	case T:
		return nil
	case []T:
		return nil
	}
	return errors.InvalidArgument(fmt.Sprintf("invalid type for field %s", f.Name()))
}
