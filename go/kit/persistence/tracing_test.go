package persistence_test

import (
	"context"
	"database/sql/driver"
	"errors"
	"net/url"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	kerrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/persistencetest"

	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"

	tracing "github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

var errThatShouldNotBeTracedAsSpanErr = errors.New("customErrThatShouldNotBeTracedAsSpanErr")

func newValidTracingConfig(t *testing.T, opts ...persistence.TracingConfigOpt) persistence.TracingConfig {
	t.Helper()

	config := persistence.NewTracingConfig(
		persistence.DBSystem(otelsemconv.DBSystemPostgreSQL.Key), "test_db",
		&url.URL{Host: "localhost:5432", Scheme: "postgresql"},
		persistence.SpanAttr(otelsemconv.DBNameKey),
		[]persistence.DBOp{"INSERT", "SELECT", "UPDATE", "DELETE", "RAW-SQL"},
		kerrors.SkipErrIfOneOf(errThatShouldNotBeTracedAsSpanErr),
		opts...,
	)
	assert.NotNil(t, config)

	return config
}

func TestNewTracingConfigInvalid(t *testing.T) {
	t.Parallel()

	type input struct {
		system     persistence.DBSystem
		dbName     string
		conn       *url.URL
		dbNameAttr persistence.SpanAttr
		dbOps      []persistence.DBOp
		opts       []persistence.TracingConfigOpt
	}

	newValidInput := func() input {
		opts := []persistence.TracingConfigOpt{
			persistence.WithTracingTableNameAttr(persistence.SpanAttr(otelsemconv.DBSQLTableKey)),
			persistence.WithTracingExcludeQueryVars(false),
		}
		in := newValidTracingConfig(t, opts...)

		return input{
			system: in.System(), dbName: in.DBName(), conn: in.Conn(),
			dbNameAttr: in.DBNameAttr(), dbOps: in.DBOps(), opts: opts,
		}
	}
	validInputUpdates := func(updates func(in *input)) input {
		in := newValidInput()
		updates(&in)

		return in
	}

	tests := []struct {
		name string
		in   input
		want error
	}{
		{
			name: "system not defined", in: validInputUpdates(func(i *input) { i.system = "" }),
			want: fields.NewErrInvalidEmptyString("system"),
		},
		{
			name: "invalid dbname attr", in: validInputUpdates(func(i *input) { i.dbNameAttr = "invaliddbnameattr" }),
			want: fields.NewErrInvalidValue("dbNameAttr", "invaliddbnameattr"),
		},
		{
			name: "no ops", in: validInputUpdates(func(i *input) { i.dbOps = []persistence.DBOp{} }),
			want: fields.NewErrInvalidNil("dbOps"),
		},
		{
			name: "invalid db name", in: validInputUpdates(func(i *input) { i.dbName = "" }),
			want: fields.NewErrInvalidEmptyString("dbName"),
		},
		{
			name: "invalid table name attr",
			in: validInputUpdates(func(i *input) {
				i.opts = []persistence.TracingConfigOpt{
					persistence.WithTracingTableNameAttr("invalidtablenameattr"),
				}
			}),
			want: fields.NewErrInvalidValue("tableNameAttr", "invalidtablenameattr"),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.PanicsWithError(
				t, test.want.Error(), func() {
					persistence.NewTracingConfig(
						test.in.system, test.in.dbName, test.in.conn,
						test.in.dbNameAttr, test.in.dbOps,
						kerrors.SkipErrIfOneOf(errThatShouldNotBeTracedAsSpanErr), test.in.opts...,
					)
				},
			)
		})
	}
}

func TestNewTracerInvalid(t *testing.T) {
	t.Parallel()

	type input struct {
		t      tracing.Tracer
		config persistence.TracingConfig
	}

	newValidInput := func() input {
		tr := tracertest.NewRecorderTracer()
		config := newValidTracingConfig(
			t, []persistence.TracingConfigOpt{
				persistence.WithTracingTableNameAttr(persistence.SpanAttr(otelsemconv.DBSQLTableKey)),
				persistence.WithTracingExcludeQueryVars(false),
			}...,
		)

		return input{t: tr, config: config}
	}
	validInputUpdates := func(updates func(in *input)) input {
		in := newValidInput()
		updates(&in)

		return in
	}

	tests := []struct {
		name string
		in   input
		want error
	}{
		{
			name: "no tracer", in: validInputUpdates(func(i *input) { i.t = nil }),
			want: fields.NewErrInvalidNil(tracing.FieldNameTracer),
		},
		{
			name: "no config", in: validInputUpdates(func(i *input) { i.config = nil }),
			want: fields.NewErrInvalidNil(fields.NameConfig),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.PanicsWithError(
				t, test.want.Error(), func() {
					persistence.NewTracer(test.in.t, test.in.config)
				},
			)
		})
	}
}

type (
	tracerStartOpInput struct {
		op   persistence.DBOp
		opts []persistence.TraceOpt
	}
	tracerEndOpInput struct {
		op   persistence.DBOp
		err  error
		opts []persistence.TraceOpt
	}
	tracerInput struct {
		config  persistence.TracingConfig
		startOp tracerStartOpInput
		endOp   tracerEndOpInput
	}
	tracerWant struct {
		startOpAssertions func(t *testing.T, startTime time.Time, trace *tracertest.Recorder)
		endOpAssertions   func(t *testing.T, startTime time.Time, trace *tracertest.Recorder)
	}
)

func opAttrs(op persistence.DBOp) []any     { return []any{"db.operation", op.String()} }
func dbNameAttrs(dbName string) []any       { return []any{"db.name", dbName} }
func statementAttrs(statement string) []any { return []any{"db.statement", statement} }
func tableAttrs(table string) []any         { return []any{"db.sql.table", table} }
func mergeSpanAttrs(attrs ...[]any) []any {
	res := []any{}
	for _, attr := range attrs {
		res = append(res, attr...)
	}
	return res
}

func TestTracer(t *testing.T) {
	t.Parallel()

	connNoCreds := "postgres://---:---@localhost:5432"
	pgConnSpanAttrs := func() []any {
		return []any{
			"db.system", "postgresql", "db.connection_string", connNoCreds,
			"server.address", "localhost", "server.port", "5432", "db.user", "test",
		}
	}

	tests := []struct {
		name string
		in   tracerInput
		want tracerWant
	}{
		{
			name: "unsupported op records no spans",
			in: tracerInput{
				config:  persistencetest.NewTracingConfigStub(persistencetest.WithTracingDBOpts("INSERT")),
				startOp: tracerStartOpInput{op: "UPDATE"}, endOp: tracerEndOpInput{op: "DELETE"},
			},
			want: tracerWant{startOpAssertions: assertNoSpan, endOpAssertions: assertNoSpan},
		},
		{
			name: "no opts on start, statement with table and error on end, records a span filled with the default config vals in start, overridden in end",
			in: tracerInput{
				config: persistencetest.NewTracingConfigStub(
					persistencetest.WithErrSpanSkipper(
						kerrors.SkipErrIfOneOf(errThatShouldNotBeTracedAsSpanErr).Merge(
							kerrors.SkipErrIfOneOf(errors.New("rnd err")),
						),
					),
				),
				startOp: tracerStartOpInput{op: "INSERT"},
				endOp: tracerEndOpInput{
					op: "INSERT", err: assert.AnError,
					opts: []persistence.TraceOpt{
						persistence.TraceStatement("INSERT rnd"), persistence.TraceTable("rnd"),
					},
				},
			},
			want: tracerWant{
				startOpAssertions: assertSpan(
					tracertest.SpanName("INSERT test_db"), tracertest.SpanNotEnded(),
					tracertest.SpanAttrs(
						mergeSpanAttrs(opAttrs("INSERT"), pgConnSpanAttrs(), dbNameAttrs("test_db"))...,
					),
				),
				endOpAssertions: assertSpan(
					tracertest.SpanName("INSERT test_db"), tracertest.SpanEnded(),
					tracertest.SpanAttrs(
						mergeSpanAttrs(
							opAttrs("INSERT"), pgConnSpanAttrs(), dbNameAttrs("test_db"),
							statementAttrs("INSERT rnd"), tableAttrs("rnd"),
						)...,
					), tracertest.SpanStatusErr(assert.AnError),
				),
			},
		},
		{
			name: "op with err that should not record an err span",
			in: tracerInput{
				config: persistencetest.NewTracingConfigStub(
					persistencetest.WithErrSpanSkipper(
						kerrors.SkipErrIfOneOf(driver.ErrSkip).
							Merge(kerrors.SkipErrIfOneOf(errThatShouldNotBeTracedAsSpanErr)),
					),
				),
				startOp: tracerStartOpInput{op: "UPDATE"},
				endOp:   tracerEndOpInput{op: "UPDATE", err: errThatShouldNotBeTracedAsSpanErr},
			},
			want: tracerWant{
				startOpAssertions: assertSpan(
					tracertest.SpanName("UPDATE test_db"), tracertest.SpanNotEnded(),
					tracertest.SpanAttrs(mergeSpanAttrs(opAttrs("UPDATE"), pgConnSpanAttrs(), dbNameAttrs("test_db"))...),
				),
				endOpAssertions: assertSpan(
					tracertest.SpanName("UPDATE test_db"), tracertest.SpanEnded(),
					tracertest.SpanAttrs(mergeSpanAttrs(opAttrs("UPDATE"), pgConnSpanAttrs(), dbNameAttrs("test_db"))...),
					tracertest.SpanStatusOK(),
				),
			},
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			tracer := tracertest.NewRecorderTracer()
			dbTracer := persistence.NewTracer(tracer, test.in.config)
			ctx, reqTime := context.Background(), time.Now().UTC()

			opStartCtx := dbTracer.TraceOpStart(ctx, test.in.startOp.op, test.in.startOp.opts...)
			test.want.startOpAssertions(t, reqTime, tracer)
			dbTracer.TraceOpEnd(opStartCtx, test.in.endOp.op, test.in.endOp.err, test.in.endOp.opts...)
			test.want.endOpAssertions(t, reqTime, tracer)
		})
	}
}

func assertNoSpan(t *testing.T, startTime time.Time, trace *tracertest.Recorder) {
	t.Helper()

	assert.Len(t, trace.Spans(), 0)
}

func assertSpan(opts ...tracertest.AssertSpanOpt) func(t *testing.T, startTime time.Time, trace *tracertest.Recorder) {
	return func(t *testing.T, startTime time.Time, trace *tracertest.Recorder) {
		t.Helper()

		assert.Len(t, trace.Spans(), 1)
		span := trace.Spans()[0]

		tracertest.AssertSpan(t, span,
			append(opts,
				tracertest.SpanStartedAfter(startTime),
				tracertest.SpanKind(tracing.SpanKindClient),
			)...,
		)
	}
}
