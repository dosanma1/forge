package fields

import (
	"bytes"
	"encoding/json"
)

type optional[T any] struct {
	Value T
}

type Optional[T any] map[bool]optional[T] // true is for value, false is for null, empty is for undefined.

func (t Optional[T]) MarshalJSON() ([]byte, error) {
	if t.IsNull() {
		return []byte("null"), nil
	} else if !t.IsDefined() {
		return []byte{}, WrappedErr("value is not set, forgot to set omitempty flag?")
	}
	return json.Marshal(t[true].Value)
}

func (t *Optional[T]) UnmarshalJSON(data []byte) error {
	if bytes.Equal(data, []byte("null")) {
		t.SetNull()
		return nil
	}
	var v T
	err := json.Unmarshal(data, &v)
	t.SetValue(v)
	return err
}

func (t *Optional[T]) SetValue(v T) {
	*t = map[bool]optional[T]{true: {Value: v}}
}

func (t Optional[T]) GetValue() T {
	return t[true].Value
}

func (t *Optional[T]) SetNull() {
	*t = map[bool]optional[T]{false: {}}
}

func (t Optional[T]) IsNull() bool {
	_, found := t[false]
	return found
}

func (t *Optional[T]) Reset() {
	*t = map[bool]optional[T]{}
}

func (t Optional[T]) IsDefined() bool {
	return len(t) != 0
}
