package pg_test

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
)

func TestPGErr(t *testing.T) {
	in := pg.NewErrUnknown(pg.NewErrUnknown(context.Canceled))
	assert.ErrorIs(t, in, context.Canceled)
	assert.ErrorIs(t, in, pg.NewErrUnknown(context.Canceled))

	in = pg.NewErrUnknown(fields.NewWrappedErr("random err"))
	assert.NotErrorIs(t, in, context.Canceled)

	in = pg.NewErrUnknown(&pgconn.PgError{Severity: "ERROR", Message: "db error", Code: "20000"})
	assert.ErrorIs(t, in, pg.NewErrUnknown(&pgconn.PgError{Severity: "ERROR", Message: "db error", Code: "20000"}))
}
