package pg

import (
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
)

var ErrPGMissingPGConn = errors.New("postgres connection is nil")

type Err struct {
	childErr error
}

func (e Err) Is(err error) bool {
	got, ok := err.(Err)
	if !ok {
		return false
	}
	pgErr, ok := e.childErr.(*pgconn.PgError)
	if !ok {
		return errors.Is(e.childErr, got.childErr)
	}
	gotPgErr, ok := got.childErr.(*pgconn.PgError)
	if !ok {
		return false
	}

	return pgErr.Code == gotPgErr.Code &&
		pgErr.Message == gotPgErr.Message &&
		pgErr.Severity == gotPgErr.Severity
}

func (e Err) Error() string {
	return fmt.Sprintf("query failed, please check the database adapter logs, %s", e.childErr.Error())
}

func (e Err) Unwrap() error {
	return e.childErr
}

func newErr(err error) error {
	return Err{
		childErr: err,
	}
}

func NewErrUnknown(err error) error {
	return newErr(err)
}
