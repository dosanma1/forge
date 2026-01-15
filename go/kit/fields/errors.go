package fields

import (
	"errors"
	"fmt"
	"reflect"
)

const (
	errDescrZeroVal  = "is not allowed to be set with a zero val"
	errDescrNilVal   = "cannot be nil"
	errDescrWrongVal = "empty or value not properly set"
)

type WrappedErr string

func (e WrappedErr) Is(err error) bool {
	return string(e) == err.Error()
}

func (e WrappedErr) Error() string {
	return string(e)
}

func NewWrappedErr(format string, args ...any) error {
	msg := fmt.Sprintf(format, args...)

	return WrappedErr(msg)
}

type ErrNilVal struct{}

func (err ErrNilVal) Error() string {
	return errDescrNilVal
}

type ErrWithFieldName struct {
	fieldName Name
	childErr  error
}

func (err ErrWithFieldName) FieldName() Name {
	return err.fieldName
}

func (err ErrWithFieldName) Error() string {
	return fmt.Sprintf("error in field %s; err: %v", err.fieldName, err.childErr)
}

func (err ErrWithFieldName) Unwrap() error {
	return err.childErr
}

func NewErrWithFieldName(fieldName Name, wrappedErr error) error {
	return ErrWithFieldName{
		fieldName: fieldName,
		childErr:  wrappedErr,
	}
}

type errTyped string

func (err errTyped) FieldType() string {
	return string(err)
}

type ErrZeroVal struct {
	errTyped
}

func (err ErrZeroVal) Error() string {
	return fmt.Sprintf(
		"%s (field type: %s)",
		errDescrZeroVal, err.FieldType(),
	)
}

type ErrEmpty struct {
	childErr error
}

func (err ErrEmpty) Unwrap() error {
	return err.childErr
}

func (err ErrEmpty) IsNil() bool {
	return errors.Is(err, ErrNilVal{})
}

func (err ErrEmpty) IsZero() bool {
	return errors.As(err, &ErrZeroVal{})
}

func (err ErrEmpty) Error() string {
	return fmt.Sprintf("empty field --%v--", err.childErr)
}

func NewErrZeroVal(fieldName Name, val any) error {
	return NewErrWithFieldName(
		fieldName,
		ErrEmpty{
			childErr: ErrZeroVal{
				errTyped(reflect.TypeOf(val).Name()),
			},
		},
	)
}

func NewErrInvalidZeroVal(fieldName Name, val any) error {
	return NewErrInvalid(
		val, NewErrZeroVal(fieldName, val),
	)
}

func NewErrNil(fieldName Name) error {
	return NewErrWithFieldName(
		fieldName,
		ErrEmpty{
			childErr: ErrNilVal{},
		},
	)
}

func NewErrInvalidType(fName Name, expected, got any) error {
	return NewErrWithFieldName(
		fName,
		NewErrInvalid(
			got,
			NewWrappedErr("request is not of the expected type: got %s expected %s", reflect.TypeOf(got), reflect.TypeOf(expected)),
		),
	)
}

func NewErrInvalidValue(fName Name, val any) error {
	return NewErrWithFieldName(fName, NewErrInvalid(val, NewWrappedErr(errDescrWrongVal)))
}

type ErrInvalid struct {
	fieldVal any
	reason   error
}

func (err ErrInvalid) FieldValue() any {
	return err.fieldVal
}

func (err ErrInvalid) Error() string {
	return fmt.Sprintf(
		"invalid field with value: %v, reason: %v",
		err.fieldVal,
		err.reason,
	)
}

func (err ErrInvalid) Unwrap() error {
	return err.reason
}

func (err ErrInvalid) Is(target error) bool {
	errField := ErrInvalid{}
	isSame := errors.As(target, &errField)
	return isSame && err.reason.Error() == errField.reason.Error()
}

func NewErrInvalid(fieldVal any, reason error) error {
	return ErrInvalid{
		fieldVal: fieldVal,
		reason:   reason,
	}
}

func NewErrInvalidEmptyString(field Name) error {
	return NewErrInvalid(
		"",
		NewErrWithFieldName(field, NewErrZeroVal(field, "")),
	)
}

func NewErrInvalidNil(field Name) error {
	return NewErrInvalid(
		nil,
		NewErrWithFieldName(field, NewErrNil(field)),
	)
}
