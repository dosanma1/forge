package pg

import (
	"github.com/jackc/pgerrcode"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/persistence"

	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

//nolint:gochecknoglobals // we want this global variable to make the system independent of the otel convention across the packages
var System persistence.DBSystem = persistence.DBSystem(otelsemconv.DBSystemPostgreSQL.Value.AsString())

func SpanErrSkipper() errors.ErrSkipFunc {
	return newSpanSkipErrIfPGErrIsOneOfValidator(
		pgerrcode.ForeignKeyViolation, pgerrcode.UniqueViolation,
	)
}

func newSpanSkipErrIfPGErrIsOneOfValidator(pgCodes ...string) errors.ErrSkipFunc {
	return func(err error) bool {
		for _, code := range pgCodes {
			if ErrorIs(err, code) {
				return true
			}
		}

		return false
	}
}
