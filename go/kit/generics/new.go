package generics

import "reflect"

// New returns a new instance of type T (must be struct or pointer to struct)
func New[T any]() T {
	z := Zero[T]()
	tType := reflect.TypeOf(z)
	if tType.Kind() == reflect.Struct {
		return z
	}

	return reflect.New(tType.Elem()).Interface().(T)
}
