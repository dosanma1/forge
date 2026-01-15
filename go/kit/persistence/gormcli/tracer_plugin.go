package gormcli

import (
	"fmt"

	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/persistence"
)

type tracingConfig struct {
	system           persistence.DBSystem
	excludeQueryVars bool
	callbackDBOps    map[callbackOp]persistence.DBOp
}

func newTracingConfig(
	system persistence.DBSystem, excludeQueryVars bool,
	callbackDBOps map[callbackOp]persistence.DBOp,
) *tracingConfig {
	return &tracingConfig{
		system: system, excludeQueryVars: excludeQueryVars, callbackDBOps: callbackDBOps,
	}
}

const (
	baseTracingPluginName = "db-tracing"
)

type callbackOp uint

const (
	callbackOpCreate callbackOp = iota
	callbackOpQuery
	callbackOpDelete
	callbackOpUpdate
	callbackOpRaw
)

type tracingPlugin struct {
	pluginName     string
	dbName, schema string
	tracer         persistence.Tracer
	config         *tracingConfig
}

func newTracingPlugin(dbName, schema string, tracer persistence.Tracer, config *tracingConfig) gorm.Plugin {
	if config == nil {
		panic(fields.NewErrInvalidNil(fields.NameConfig))
	}
	if len(dbName) < 1 {
		panic(fields.NewErrInvalidEmptyString(fields.Name("dbName")))
	}

	pluginName := fmt.Sprintf("%s-%s", baseTracingPluginName, config.system)

	return &tracingPlugin{
		tracer: tracer, pluginName: pluginName,
		config: config,
		dbName: dbName, schema: schema,
	}
}

func (tp *tracingPlugin) Name() string {
	return tp.pluginName
}

func (tp *tracingPlugin) traceNewDBOp(op persistence.DBOp) func(*gorm.DB) {
	return func(tx *gorm.DB) {
		tx.Statement.Context = tp.tracer.TraceOpStart(
			tx.Statement.Context,
			op, persistence.TraceDBName(tp.schema),
			persistence.TraceTable(tx.Statement.Table),
		)
	}
}

func (tp *tracingPlugin) traceDBOpEnd(op persistence.DBOp) func(*gorm.DB) {
	return func(tx *gorm.DB) {
		qVars := tx.Statement.Vars
		if tp.config.excludeQueryVars {
			// Replace query variables with '?' to mask them
			qVars = make([]any, len(tx.Statement.Vars))

			for i := 0; i < len(qVars); i++ {
				qVars[i] = "?"
			}
		}

		tp.tracer.TraceOpEnd(
			tx.Statement.Context, op, tx.Error,
			persistence.TraceDBName(tp.schema),
			persistence.TraceStatement(tx.Dialector.Explain(tx.Statement.SQL.String(), qVars...)),
		)
	}
}

//nolint:misspell // gorm plugin interface uses american english for Initialize func.
func (tp *tracingPlugin) Initialize(db *gorm.DB) error {
	// create
	err := db.Callback().Create().Before("gorm:create").Register(
		tp.getOpStageName(_stageBeforeCreate),
		tp.traceNewDBOp(tp.config.callbackDBOps[callbackOpCreate]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageBeforeCreate), err)
	err = db.Callback().Create().After("gorm:create").Register(
		tp.getOpStageName(_stageAfterCreate),
		tp.traceDBOpEnd(tp.config.callbackDBOps[callbackOpCreate]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageAfterCreate), err)

	// update
	err = db.Callback().Update().Before("gorm:update").Register(
		tp.getOpStageName(_stageBeforeUpdate),
		tp.traceNewDBOp(tp.config.callbackDBOps[callbackOpUpdate]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageBeforeUpdate), err)
	err = db.Callback().Update().After("gorm:update").Register(
		tp.getOpStageName(_stageAfterUpdate),
		tp.traceDBOpEnd(tp.config.callbackDBOps[callbackOpUpdate]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageAfterUpdate), err)

	// query
	err = db.Callback().Query().Before("gorm:query").Register(
		tp.getOpStageName(_stageBeforeQuery),
		tp.traceNewDBOp(tp.config.callbackDBOps[callbackOpQuery]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageBeforeQuery), err)
	err = db.Callback().Query().After("gorm:query").Register(
		tp.getOpStageName(_stageAfterQuery),
		tp.traceDBOpEnd(tp.config.callbackDBOps[callbackOpQuery]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageAfterQuery), err)

	// delete
	err = db.Callback().Delete().Before("gorm:delete").Register(
		tp.getOpStageName(_stageBeforeDelete),
		tp.traceNewDBOp(tp.config.callbackDBOps[callbackOpDelete]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageBeforeDelete), err)
	err = db.Callback().Delete().After("gorm:delete").Register(
		tp.getOpStageName(_stageAfterDelete),
		tp.traceDBOpEnd(tp.config.callbackDBOps[callbackOpDelete]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageAfterDelete), err)

	// raw
	err = db.Callback().Raw().Before("gorm:raw").Register(
		tp.getOpStageName(_stageBeforeRaw),
		tp.traceNewDBOp(tp.config.callbackDBOps[callbackOpRaw]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageBeforeRaw), err)
	err = db.Callback().Raw().After("gorm:raw").Register(
		tp.getOpStageName(_stageAfterRaw),
		tp.traceDBOpEnd(tp.config.callbackDBOps[callbackOpRaw]),
	)
	panicIfErr(tp.pluginName, tp.getOpStageName(_stageAfterRaw), err)

	return nil
}

// operationStage indicates the timing when the operation happens.
type operationStage string

// Name returns the actual string of operationStage.
func (op operationStage) Name() string {
	return string(op)
}

func (tp *tracingPlugin) getOpStageName(op operationStage) string {
	return fmt.Sprintf("%s:%s", tp.pluginName, op.Name())
}

const (
	_stageBeforeCreate operationStage = "before_create"
	_stageAfterCreate  operationStage = "after_create"
	_stageBeforeUpdate operationStage = "before_update"
	_stageAfterUpdate  operationStage = "after_update"
	_stageBeforeQuery  operationStage = "before_query"
	_stageAfterQuery   operationStage = "after_query"
	_stageBeforeDelete operationStage = "before_delete"
	_stageAfterDelete  operationStage = "after_delete"
	_stageBeforeRaw    operationStage = "before_raw"
	_stageAfterRaw     operationStage = "after_raw"
)

func newOpStageErr(pluginName, stageName string, err error) error {
	return fields.NewWrappedErr(
		"gorm plugin %q err at stage=%s, err: %s",
		pluginName, stageName, err.Error(),
	)
}

func panicIfErr(pluginName, stageName string, err error) {
	if err == nil {
		return
	}

	panic(newOpStageErr(pluginName, stageName, err))
}
