// Package mock ...
package mock

import (
	"database/sql/driver"
	"fmt"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/persistencetest"
)

type setup struct {
	monitorPings              bool
	isRegex                   bool
	queryMatcher              sqlmock.QueryMatcher
	valueConverter            driver.ValueConverter
	gormCliOpts               []gormcli.Option
	envars                    []string
	clientInitValidationFuncs []func(m sqlmock.Sqlmock)
}

type SetupOpt func(s *setup)

func PingMonitorEnabled(enabled bool) SetupOpt {
	return func(s *setup) {
		s.monitorPings = enabled
		if s.monitorPings {
			clientInitValidationFuncs(func(m sqlmock.Sqlmock) { m.ExpectPing() })(s)
		}
	}
}

func queryMatcher(matcher sqlmock.QueryMatcher) SetupOpt {
	return func(s *setup) {
		s.queryMatcher = matcher
	}
}

func RegexQueryMatcher() SetupOpt {
	return func(s *setup) {
		queryMatcher(sqlmock.QueryMatcherRegexp)(s)
		s.isRegex = true
	}
}

func ValueConverter(converter driver.ValueConverter) SetupOpt {
	return func(s *setup) {
		s.valueConverter = converter
	}
}

func GormCliOpts(opts ...gormcli.Option) SetupOpt {
	return func(s *setup) {
		s.gormCliOpts = opts
	}
}

func WithEnvVars(keyVals ...string) SetupOpt {
	return func(s *setup) {
		s.envars = keyVals
	}
}

func clientInitValidationFuncs(fs ...func(m sqlmock.Sqlmock)) SetupOpt {
	return func(s *setup) {
		s.clientInitValidationFuncs = append(s.clientInitValidationFuncs, fs...)
	}
}

func ValidateSchemaIsSet(schema string) SetupOpt {
	return func(s *setup) {
		clientInitValidationFuncs(
			func(m sqlmock.Sqlmock) {
				m.ExpectExec(fmt.Sprintf("SET SEARCH_PATH to %s", schema)).
					WillReturnResult(driver.ResultNoRows)
			},
		)(s)
	}
}

func validateCurrentSchema(schema string) SetupOpt {
	return func(s *setup) {
		clientInitValidationFuncs(
			func(m sqlmock.Sqlmock) {
				m.ExpectQuery(`SELECT current_schema`).
					WillReturnRows(
						sqlmock.NewRows([]string{"current_schema"}).
							AddRow(schema),
					)
			},
		)(s)
	}
}

func defaultOpts() []SetupOpt {
	return []SetupOpt{
		PingMonitorEnabled(true), queryMatcher(sqlmock.QueryMatcherEqual),
		ValueConverter(driver.DefaultParameterConverter),
		WithEnvVars("ENV", "dev", "LOG_LEVEL", "debug", "DB_LOG_LEVEL", "debug"),
		GormCliOpts(
			gormcli.WithDefaultTransaction(false),
			gormcli.WithSingularTable(true),
		),
	}
}

type Cli struct {
	*gormcli.DBClient
	sqlmock.Sqlmock
	isRegex bool
}

func (c Cli) HasRegexMatcher() bool {
	return c.isRegex
}

func GormCli(t *testing.T, opts ...SetupOpt) *Cli {
	t.Helper()

	s := &setup{
		clientInitValidationFuncs: []func(m sqlmock.Sqlmock){},
		gormCliOpts:               []gormcli.Option{},
	}
	for _, opt := range append(defaultOpts(), opts...) {
		opt(s)
	}
	validateCurrentSchema("schema_123456")(s)

	for i := 0; i < len(s.envars); i += 2 {
		t.Setenv(s.envars[i], s.envars[i+1])
	}

	db, mock, err := sqlmock.New(
		sqlmock.MonitorPingsOption(s.monitorPings),
		sqlmock.QueryMatcherOption(s.queryMatcher),
		sqlmock.ValueConverterOption(s.valueConverter),
	)
	assert.Nil(t, err)
	assert.NotNil(t, db)
	assert.NotNil(t, mock)

	for _, initValFunc := range s.clientInitValidationFuncs {
		initValFunc(mock)
	}

	cli, err := gormcli.New(
		postgres.New(postgres.Config{Conn: db}),
		monitoring.New(loggertest.NewStubLogger(t), tracertest.NewRecorderTracer()),
		persistencetest.NewTracingConfigStub(),
		s.gormCliOpts...,
	)
	assert.Nil(t, err)

	return &Cli{
		DBClient: cli,
		Sqlmock:  mock,
		isRegex:  s.isRegex,
	}
}
