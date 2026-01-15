package sqldb

import (
	"database/sql"
	"database/sql/driver"
	"net/url"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/persistence"

	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

const (
	SpanAttrDBName    persistence.SpanAttr = persistence.SpanAttr(otelsemconv.DBNameKey)
	SpanAttrTableName persistence.SpanAttr = persistence.SpanAttr(otelsemconv.DBSQLTableKey)

	DBOpSelect persistence.DBOp = "SELECT"
	DBOpInsert persistence.DBOp = "INSERT"
	DBOpUpdate persistence.DBOp = "UPDATE"
	DBOpDelete persistence.DBOp = "DELETE"
	DBOpRawSQL persistence.DBOp = "RAW-SQL"
)

func NewTracingConfig(
	system persistence.DBSystem, dbName string, connURL *url.URL,
	extraSpanErrSkippers ...errors.ErrSkipper,
) persistence.TracingConfig {
	spanSkipper := errors.SkipErrIfOneOf(driver.ErrSkip, sql.ErrNoRows)
	for _, f := range extraSpanErrSkippers {
		spanSkipper = spanSkipper.Merge(f)
	}
	return persistence.NewTracingConfig(
		system, dbName, connURL, SpanAttrDBName,
		[]persistence.DBOp{
			DBOpSelect, DBOpInsert, DBOpUpdate, DBOpDelete, DBOpRawSQL,
		}, spanSkipper,
		persistence.WithTracingTableNameAttr(SpanAttrTableName),
	)
}
