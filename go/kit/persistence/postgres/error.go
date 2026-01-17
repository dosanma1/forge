package postgres

import (
	"errors"
	"fmt"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/jackc/pgx/v5/pgconn"
)

const ErrDuplicateKey = "23505"

func ErrorIs(err error, code string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == code {
		return true
	}
	return false
}

func NewErrUnknown(err error) error {
	return apierrors.InternalError(fmt.Sprintf("query failed, please check the database adapter logs, %s", err.Error()))
}
