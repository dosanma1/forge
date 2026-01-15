package sqldb

import (
	"fmt"

	"github.com/dosanma1/forge/go/kit/fields"
)

// ConnectionErr defines a database connection error.
type ConnectionErr struct {
	wrappedErr error
}

func (err ConnectionErr) Error() string {
	return fmt.Sprintf("connection error: %s", err.wrappedErr.Error())
}

// Unwrap returns the child error (the specific error reason of the connection error).
func (err ConnectionErr) Unwrap() error {
	return err.wrappedErr
}

func newErrConn(wrappedErr error) error {
	return ConnectionErr{
		wrappedErr: wrappedErr,
	}
}

func NewErrEmptyDBConnection() error {
	return newErrConn(fields.NewWrappedErr("empty sql.DB connection handle"))
}

func newErrConnInvalidDriver(kind DriverType) error {
	return newErrConn(fields.NewWrappedErr(
		"driver type: %s not supported, allowedValues: %v",
		string(kind),
		allDriverTypes,
	))
}

func newErrConnEmptyDSN() error {
	return newErrConn(fields.NewWrappedErr("empty dsn"))
}

// EmptyDSNFieldErr defines an error caused by an empty mandatory
// field of the database DSN.
type EmptyDSNFieldErr struct {
	field connField
}

func (err EmptyDSNFieldErr) Error() string {
	return fmt.Sprintf("empty dsn field %s", err.field.String())
}

func newErrEmptyDSNField(field connField) error {
	return newErrConn(EmptyDSNFieldErr{field: field})
}
