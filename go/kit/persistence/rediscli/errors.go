package rediscli

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

func newPingErr() error {
	return newErrConn(fields.NewWrappedErr("no PONG received"))
}

func newNotifyKeySpaceEventsErr() error {
	return newErrConn(fields.NewWrappedErr("notify-keyspace-events not configured correctly"))
}
