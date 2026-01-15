package pg_test

import (
	"testing"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/pg"
)

func TestSpanErrSkipper(t *testing.T) {
	t.Parallel()

	pgErr := func(code string) *pgconn.PgError {
		return &pgconn.PgError{Code: code}
	}

	tests := []struct {
		name string
		in   error
		want bool
	}{
		{"error that should be recorded as an err span", assert.AnError, false},
		{"pgerrcode.ForeignKeyViolation shoult not be recorded as an err span", pgErr(pgerrcode.ForeignKeyViolation), true},
		{"pgerrcode.UniqueViolation shoult not be recorded as an err span", pgErr(pgerrcode.UniqueViolation), true},
		{"pgerrcode.RaiseException shoult be recorded as an err span", pgErr(pgerrcode.RaiseException), false},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			validator := pg.SpanErrSkipper()
			assert.Equal(t, test.want, validator(test.in))
		})
	}
}
