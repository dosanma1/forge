package persistence

import (
	"context"
	"fmt"
	"io"
	"maps"
	"net"
	"net/url"
	"strings"

	"go.opentelemetry.io/otel/attribute"
	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/kslices"
	tracing "github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type DBOp string

func (op DBOp) String() string {
	return string(op)
}

type DBSystem string

func (s DBSystem) String() string {
	return string(s)
}

type SpanAttr string

const (
	SpanAttrSystem           SpanAttr = SpanAttr(otelsemconv.DBSystemKey)
	SpanAttrStatement        SpanAttr = SpanAttr(otelsemconv.DBStatementKey)
	spanAttrOp               SpanAttr = SpanAttr(otelsemconv.DBOperationKey)
	spanAttrConn             SpanAttr = SpanAttr(otelsemconv.DBConnectionStringKey)
	spanAttrUser             SpanAttr = SpanAttr(otelsemconv.DBUserKey)
	spanAttrServerAddr       SpanAttr = SpanAttr("server.address") // used when we have a hostname
	spanAttrServerPort       SpanAttr = SpanAttr("server.port")
	spanAttrServerSocketAddr          = SpanAttr("server.socket.address") // used when we have a physical ip
	spanAttrServerSocketPort SpanAttr = SpanAttr("server.socket.port")
)

func (sa SpanAttr) String() string {
	return string(sa)
}

type TracingConfig interface {
	System() DBSystem
	DBName() string
	DBNameAttr() SpanAttr
	TableNameAttr() SpanAttr
	DBOps() []DBOp
	ExcludeQueryVars() bool
	Conn() *url.URL
	SpanErrSkipper() errors.ErrSkipper
}

type tracingConfig struct {
	system           DBSystem
	dbName           string
	dbNameAttr       SpanAttr
	tableNameAttr    SpanAttr
	dbOps            []DBOp
	excludeQueryVars bool
	connURL          *url.URL
	errSpanSkipper   errors.ErrSkipper
}

func (tc *tracingConfig) System() DBSystem {
	return tc.system
}

func (tc *tracingConfig) DBNameAttr() SpanAttr {
	return tc.dbNameAttr
}

func (tc *tracingConfig) TableNameAttr() SpanAttr {
	return tc.tableNameAttr
}

func (tc *tracingConfig) DBOps() []DBOp {
	return tc.dbOps
}

func (tc *tracingConfig) ExcludeQueryVars() bool {
	return tc.excludeQueryVars
}

func (tc *tracingConfig) Conn() *url.URL {
	return tc.connURL
}

func (tc *tracingConfig) DBName() string {
	return tc.dbName
}

func (tc *tracingConfig) SpanErrSkipper() errors.ErrSkipper {
	return tc.errSpanSkipper
}

type TracingConfigOpt func(c *tracingConfig)

func WithTracingTableNameAttr(tableNameAttr SpanAttr) TracingConfigOpt {
	return func(c *tracingConfig) {
		c.tableNameAttr = tableNameAttr
	}
}

func WithTracingExcludeQueryVars(excludeQueryVars bool) TracingConfigOpt {
	return func(c *tracingConfig) {
		c.excludeQueryVars = excludeQueryVars
	}
}

func defaultTracingConfigOpts() []TracingConfigOpt {
	return []TracingConfigOpt{
		WithTracingExcludeQueryVars(false),
	}
}

func tracingDBNameAttrMust(dbNameAttr SpanAttr) {
	if dbNameAttr.String() == string(otelsemconv.DBNameKey) ||
		dbNameAttr.String() == string(otelsemconv.DBRedisDBIndexKey) {
		return
	}

	panic(fields.NewErrInvalidValue("dbNameAttr", dbNameAttr))
}

func tableNameAttrMust(tableNameAttr SpanAttr) {
	if len(tableNameAttr.String()) < 1 {
		return
	}

	if tableNameAttr.String() == string(otelsemconv.DBSQLTableKey) ||
		tableNameAttr.String() == string(otelsemconv.DBCassandraTableKey) {
		return
	}

	panic(fields.NewErrInvalidValue("tableNameAttr", tableNameAttr))
}

func validateConfig(c *tracingConfig) {
	if len(c.system) < 1 {
		panic(fields.NewErrInvalidEmptyString("system"))
	}
	tracingDBNameAttrMust(c.dbNameAttr)
	if len(c.dbOps) < 1 {
		panic(fields.NewErrInvalidNil("dbOps"))
	}
	if len(c.dbName) < 1 {
		panic(fields.NewErrInvalidEmptyString("dbName"))
	}
	tableNameAttrMust(c.tableNameAttr)
}

func NewTracingConfig(
	system DBSystem, dBName string, conn *url.URL,
	dbNameAttr SpanAttr, dbOps []DBOp, errSpanSkipper errors.ErrSkipper, opts ...TracingConfigOpt,
) *tracingConfig {
	eSpanSkipper := errors.SkipErrIfOneOf(io.EOF, context.Canceled)
	if errSpanSkipper != nil {
		eSpanSkipper = eSpanSkipper.Merge(errSpanSkipper)
	}
	c := &tracingConfig{
		system:         system,
		dbNameAttr:     dbNameAttr,
		dbOps:          dbOps,
		dbName:         dBName,
		connURL:        conn,
		errSpanSkipper: eSpanSkipper,
	}
	for _, opt := range append(defaultTracingConfigOpts(), opts...) {
		opt(c)
	}

	validateConfig(c)

	return c
}

type traceOpConfig struct {
	dbNameAttr    SpanAttr
	tableNameAttr SpanAttr
	attrs         map[SpanAttr]tracing.KeyValue
	isMultiCmdOp  bool
}

func (c *traceOpConfig) makeSpanAttrs() []tracing.KeyValue {
	res := make([]tracing.KeyValue, len(c.attrs))
	i := 0
	for _, v := range c.attrs {
		res[i] = v
		i++
	}
	return res
}

func (c *traceOpConfig) dbName() string {
	dbName := c.attrs[c.dbNameAttr].Value().(string)
	if len(dbName) < 1 {
		panic(fields.NewErrInvalidValue(fields.Name(c.dbNameAttr.String()), dbName))
	}

	return dbName
}

func (c *traceOpConfig) tableName() string {
	tableAttr := c.attrs[c.tableNameAttr]
	if tableAttr == nil {
		return ""
	}

	return tableAttr.Value().(string)
}

func newTraceOpConfig(t *tracer) *traceOpConfig {
	return &traceOpConfig{
		dbNameAttr: t.dbNameAttrName, tableNameAttr: t.tableNameAttrName,
		attrs: maps.Clone(t.baseAttrs),
	}
}

type TraceOpt func(c *traceOpConfig)

func withTracingAttr(attrName SpanAttr, val any) TraceOpt {
	return func(c *traceOpConfig) {
		c.attrs[attrName] = tracing.NewKeyValue(
			attrName.String(), val,
		)
	}
}

func withTracingAttrStr(attrName SpanAttr, attrVal string) TraceOpt {
	return func(c *traceOpConfig) {
		if len(attrVal) < 1 {
			return
		}
		withTracingAttr(attrName, attrVal)(c)
	}
}

func WithMultiCmdOp() TraceOpt {
	return func(c *traceOpConfig) {
		c.isMultiCmdOp = true
	}
}

func TraceDBName(dbName string) TraceOpt {
	return func(c *traceOpConfig) {
		withTracingAttrStr(c.dbNameAttr, dbName)(c)
	}
}

func TraceTable(table string) TraceOpt {
	return func(c *traceOpConfig) {
		withTracingAttrStr(c.tableNameAttr, table)(c)
	}
}

func TraceStatement(statement string) TraceOpt {
	return withTracingAttrStr(SpanAttrStatement, statement)
}

func TraceUser(user string) TraceOpt {
	return withTracingAttrStr(spanAttrUser, user)
}

func traceDBOp(op DBOp) TraceOpt {
	return withTracingAttr(spanAttrOp, op.String())
}

type NetworkChangeListener interface {
	ConnChanged(*url.URL)
}

type NameChangeListener interface {
	NameChanged(string)
}

type Tracer interface {
	// TraceOpStart injects a new db op span into the context.
	//
	// The span will end later when calling TraceDBOpEnd which will correlate the
	// op and mark the execution as finished.
	//
	// OTEL tracing db conventions https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/database/
	TraceOpStart(
		ctx context.Context,
		op DBOp,
		opts ...TraceOpt,
	) context.Context
	TraceOpEnd(ctx context.Context, op DBOp, err error, opts ...TraceOpt)
}

func genTracingSystemAttr(system DBSystem) tracing.KeyValue {
	systemAttr := attribute.KeyValue{Key: otelsemconv.DBSystemKey}
	if len(system) > 1 {
		systemAttr = systemAttr.Key.String(system.String())
	}

	if !systemAttr.Valid() {
		panic(
			fields.NewErrInvalidValue(
				fields.NameConfig.Merge(fields.Name(string(otelsemconv.DBSystemKey))), system,
			),
		)
	}

	return tracing.NewKeyValue(SpanAttrSystem.String(), systemAttr.Value.AsString())
}

func connURLNoCreds(connURL *url.URL) *url.URL {
	noCredsURL := *connURL
	noCredsURL.User = url.UserPassword("---", "---")

	return &noCredsURL
}

func getServerAddrKV(host string) tracing.KeyValue {
	val := host
	attrName := spanAttrServerAddr
	ip := net.ParseIP(host)
	if len(ip) > 0 {
		attrName = spanAttrServerSocketAddr
	}

	return tracing.NewKeyValue(attrName.String(), val)
}

func getServerPortKV(port string, physicalAddr bool) tracing.KeyValue {
	attrName := spanAttrServerPort
	if physicalAddr {
		attrName = spanAttrServerSocketPort
	}

	return tracing.NewKeyValue(attrName.String(), port)
}

func newConnAttrs(connURL *url.URL) []tracing.KeyValue {
	res := []tracing.KeyValue{}
	if connURL == nil {
		return res
	}
	noCredsURL := connURLNoCreds(connURL)
	if noCredsURL == nil {
		return res
	}
	res = append(res, tracing.NewKeyValue(spanAttrConn.String(), noCredsURL.String()))
	isPhysicalAddr := false
	if len(connURL.Hostname()) > 0 {
		kv := getServerAddrKV(connURL.Hostname())
		isPhysicalAddr = (kv.Key() == spanAttrServerSocketAddr.String())
		res = append(res, kv)
	}
	if len(connURL.Port()) > 0 {
		res = append(res, getServerPortKV(connURL.Port(), isPhysicalAddr))
	}

	return res
}

func newUserAttrFromConn(connURL *url.URL) tracing.KeyValue {
	if connURL == nil || connURL.User == nil || len(connURL.User.Username()) < 1 {
		return nil
	}

	return tracing.NewKeyValue(spanAttrUser.String(), connURL.User.Username())
}

type tracer struct {
	tracing.Tracer
	dbNameAttrName, tableNameAttrName SpanAttr
	allowedDBOps                      []DBOp
	baseAttrs                         map[SpanAttr]tracing.KeyValue
	spanErrSkipper                    errors.ErrSkipper
}

func NewTracer(t tracing.Tracer, config TracingConfig) Tracer {
	if t == nil {
		panic(fields.NewErrInvalidNil(tracing.FieldNameTracer))
	}
	if config == nil {
		panic(fields.NewErrInvalidNil(fields.NameConfig))
	}

	baseAttrs := make(map[SpanAttr]tracing.KeyValue)

	systemAttr := genTracingSystemAttr(config.System())
	baseAttrs[SpanAttr(systemAttr.Key())] = systemAttr
	connAttrs := newConnAttrs(config.Conn())
	if len(connAttrs) > 0 {
		for _, attr := range connAttrs {
			baseAttrs[SpanAttr(attr.Key())] = attr
		}
	}
	userAttr := newUserAttrFromConn(config.Conn())
	if userAttr != nil {
		baseAttrs[SpanAttr(userAttr.Key())] = userAttr
	}
	if len(config.DBName()) > 0 {
		baseAttrs[SpanAttr(config.DBNameAttr().String())] = tracing.NewKeyValue(
			config.DBNameAttr().String(), config.DBName(),
		)
	}

	return &tracer{
		Tracer:         t,
		dbNameAttrName: config.DBNameAttr(), tableNameAttrName: config.TableNameAttr(),
		allowedDBOps: config.DBOps(), baseAttrs: baseAttrs,
		spanErrSkipper: config.SpanErrSkipper(),
	}
}

func (t *tracer) ConnChanged(connURL *url.URL) {
	connAttrs := newConnAttrs(connURL)
	if len(connAttrs) > 0 {
		for _, attr := range connAttrs {
			t.baseAttrs[SpanAttr(attr.Key())] = attr
		}
	}
}

func (t *tracer) NameChanged(name string) {
	t.baseAttrs[t.dbNameAttrName] = tracing.NewKeyValue(
		t.dbNameAttrName.String(), name,
	)
}

// The span name SHOULD be set to a low cardinality value representing the statement executed on the database.
// It MAY be a stored procedure name (without arguments), DB statement without variable arguments, operation name, etc.
// Since SQL statements may have very high cardinality even without arguments, SQL spans SHOULD be named the following
// way, unless the statement is known to be of low cardinality: <db.operation> <db.name>.<db.sql.table>, provided
// that db.operation and db.sql.table are available. If db.sql.table is not available due to its semantics,
// the span SHOULD be named <db.operation> <db.name>. It is not recommended to attempt any client-side
// parsing of db.statement just to get these properties, they should only be used if the library being instrumented
// already provides them. When it’s otherwise impossible to get any meaningful span name, db.name or the
// tech-specific database name MAY be used.
func getSpanName(op DBOp, dbName, dbTable string) string {
	if len(dbTable) < 1 {
		return fmt.Sprintf("%s %s", op.String(), dbName)
	}

	return fmt.Sprintf("%s %s.%s", op.String(), dbName, dbTable)
}

func (t *tracer) canTraceOp(op DBOp, isMultiCmd bool) bool {
	ops := []string{op.String()}
	if isMultiCmd {
		ops = strings.Split(op.String(), " ")
	}

	for _, o := range ops {
		_, found := kslices.Find(t.allowedDBOps, func(s DBOp) bool { return o == s.String() })
		if !found {
			return false
		}
	}

	return true
}

func defaultTraceOpStartOpts(op DBOp) []TraceOpt {
	if len(op) < 1 {
		panic(fields.NewErrInvalidValue(fields.Name(spanAttrOp.String()), op))
	}

	return []TraceOpt{traceDBOp(op)}
}

func (t *tracer) TraceOpStart(
	ctx context.Context,
	op DBOp, opts ...TraceOpt,
) context.Context {
	c := newTraceOpConfig(t)
	for _, opt := range append(defaultTraceOpStartOpts(op), opts...) {
		opt(c)
	}

	if !t.canTraceOp(op, c.isMultiCmdOp) {
		return ctx
	}

	spanCtx, span := t.Start(
		ctx, tracing.WithName(getSpanName(op, c.dbName(), c.tableName())),
		tracing.WithSpanKind(tracing.SpanKindClient),
	)
	span.SetAttributes(c.makeSpanAttrs()...)

	return spanCtx
}

func (t *tracer) TraceOpEnd(ctx context.Context, op DBOp, err error, opts ...TraceOpt) {
	c := newTraceOpConfig(t)
	for _, opt := range opts {
		opt(c)
	}

	if !t.canTraceOp(op, c.isMultiCmdOp) {
		return
	}

	span := t.SpanFromContext(ctx)
	span.SetAttributes(c.makeSpanAttrs()...)

	var spanErr error
	if err != nil && !t.spanErrSkipper.SkipErr(err) {
		spanErr = err
	}
	tracing.EndSpan(span, &spanErr)
}
