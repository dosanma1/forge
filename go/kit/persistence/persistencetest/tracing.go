package persistencetest

import (
	"net/url"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

type TracingConfigOpt func(s *TracingConfigStub)

type TracingConfigStub struct {
	system           persistence.DBSystem
	spanAttrDBName   persistence.SpanAttr
	tableNameAttr    persistence.SpanAttr
	dbOps            []persistence.DBOp
	excludeQueryVars bool
	conn             *url.URL
	dbName           string
	errSpanSkipper   errors.ErrSkipper
}

func (tcs *TracingConfigStub) System() persistence.DBSystem {
	return tcs.system
}

func (tcs *TracingConfigStub) DBNameAttr() persistence.SpanAttr {
	return tcs.spanAttrDBName
}

func (tcs *TracingConfigStub) TableNameAttr() persistence.SpanAttr {
	return tcs.tableNameAttr
}

func (tcs *TracingConfigStub) DBOps() []persistence.DBOp {
	return tcs.dbOps
}

func (tcs *TracingConfigStub) ExcludeQueryVars() bool {
	return tcs.excludeQueryVars
}

func (tcs *TracingConfigStub) Conn() *url.URL {
	return tcs.conn
}

func (tcs *TracingConfigStub) DBName() string {
	return tcs.dbName
}

func (tcs *TracingConfigStub) SpanErrSkipper() errors.ErrSkipper {
	return tcs.errSpanSkipper
}

func WithTracingExcludeQueryVars(excludeQueryVars bool) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.excludeQueryVars = excludeQueryVars
	}
}

func WithTracingConfigDBSystem(dbSystem persistence.DBSystem) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.system = dbSystem
	}
}

func WithTracingSpanAttrDBName(dbNameAttr persistence.SpanAttr) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.spanAttrDBName = dbNameAttr
	}
}

func WithTracingSpanAttrTableName(tableNameAttr persistence.SpanAttr) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.tableNameAttr = tableNameAttr
	}
}

func WithTracingDBOpts(dbOps ...persistence.DBOp) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.dbOps = dbOps
	}
}

func WithTracingDBConn(conn *url.URL) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.conn = conn
	}
}

func WithDBName(dbName string) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		s.dbName = dbName
	}
}

func WithErrSpanSkipper(fs ...errors.ErrSkipFunc) TracingConfigOpt {
	return func(s *TracingConfigStub) {
		if len(fs) > 0 {
			errSpanValF := fs[0]
			for i := 1; i < len(fs); i++ {
				errSpanValF = errSpanValF.Merge(fs[i])
			}
			s.errSpanSkipper = errSpanValF
		} else {
			s.errSpanSkipper = nil
		}
	}
}

func defaultTracingConfigOpts() []TracingConfigOpt {
	return []TracingConfigOpt{
		WithTracingConfigDBSystem(pg.System),
		WithTracingSpanAttrDBName(sqldb.SpanAttrDBName),
		WithTracingSpanAttrTableName(sqldb.SpanAttrTableName),
		WithTracingDBOpts(
			sqldb.DBOpSelect, sqldb.DBOpInsert, sqldb.DBOpUpdate, sqldb.DBOpDelete,
		),
		WithTracingExcludeQueryVars(false),
		WithTracingDBConn(
			&url.URL{
				Host: "localhost:5432", Scheme: "postgres",
				User: url.UserPassword("test", "test"),
			},
		),
		WithDBName("test_db"),
		WithErrSpanSkipper(func(err error) bool { return true }),
	}
}

func NewTracingConfigStub(opts ...TracingConfigOpt) persistence.TracingConfig {
	s := new(TracingConfigStub)
	for _, opt := range append(defaultTracingConfigOpts(), opts...) {
		opt(s)
	}

	return s
}
