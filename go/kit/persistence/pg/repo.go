// Package pg ...
package pg

import (
	"context"
	"fmt"
	"reflect"
	"sort"
	"strings"
	"time"

	"golang.org/x/exp/maps"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/lib/pq"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/kslices"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type Repo struct {
	DB      *gormcli.DBClient
	fMapper FieldColumnMapper
}

type queryApplySetup struct {
	lock *clause.Locking
}

type queryApplyOption func(*queryApplySetup)

// withLock applies database locking based on the lock information retrieved from the context.
// It checks the lock level and mode to determine the appropriate locking clause for the database query.
//
// If the conditions don't match the expected cases, the function panics with an error message
// indicating an unexpected locking mode or level.
//
// The function returns a copy of the repository with the applied database clause.
//
// For more information regarding PostgreSQL locks visit: https://www.postgresql.org/docs/14/explicit-locking.html
func withLock(ctx context.Context, tableName string) queryApplyOption {
	return func(s *queryApplySetup) {
		lock := repository.LockFromCtx(ctx)
		if lock == nil {
			return
		}

		switch {
		case lock.Level() == repository.LockLevelRow:
			switch {
			case lock.Contains(repository.LockModeExclusive):
				s.lock = &clause.Locking{
					Strength: "UPDATE",
					Table:    clause.Table{Name: tableName},
				}
			default:
				panic("unexpected locking mode")
			}
		default:
			panic("unexpected locking level")
		}
	}
}

func (r *Repo) QueryApply(ctx context.Context, q query.Query, ops ...queryApplyOption) (tx *gorm.DB) {
	tx = r.queryApply(ctx, q, "", ops...)

	return tx
}

func (r *Repo) FMapper() FieldColumnMapper {
	return r.fMapper
}

func (r *Repo) QueryApplyWithTableName(ctx context.Context, q query.Query, tableName string, ops ...queryApplyOption) (tx *gorm.DB) {
	return r.queryApply(ctx, q, tableName, ops...)
}

func (r *Repo) queryApply(ctx context.Context, q query.Query, tableName string, ops ...queryApplyOption) (tx *gorm.DB) {
	ops = append(ops, withLock(ctx, tableName))

	s := new(queryApplySetup)
	for _, v := range ops {
		v(s)
	}

	tx = r.DB.WithContext(ctx)
	if q == nil {
		return
	}
	tx = filterApply(tx, r.fMapper, q.Filters(), tableName)
	tx = sortingApply(tx, r.fMapper, q.Sorting())
	if q.Pagination() != nil {
		tx = paginationApply(tx, q.Pagination())
	}
	if s.lock != nil {
		tx = tx.Clauses(s.lock)
	}

	return
}

func (r *Repo) CountApply(ctx context.Context, model any, q query.Query) (tx *gorm.DB) {
	return r.countApply(ctx, model, q, "")
}

func (r *Repo) CountApplyWithTableName(ctx context.Context, model any, q query.Query, tableName string) (tx *gorm.DB) {
	return r.countApply(ctx, model, q, tableName)
}

func (r *Repo) countApply(ctx context.Context, model any, q query.Query, tableName string) (tx *gorm.DB) {
	tx = r.DB.WithContext(ctx).Model(model)
	if q == nil {
		return
	}
	if tableName != "" {
		tx = tx.Table(tableName)
	}
	tx = filterApply(tx, r.fMapper, q.Filters(), tableName)

	return
}

func (r *Repo) Commit() error {
	return r.DB.Commit().Error
}

func (r *Repo) Rollback() error {
	return r.DB.Rollback().Error
}

func (r *Repo) PatchApply(ctx context.Context, q query.Query, model any, toPatch map[fields.Name]any) (tx *gorm.DB) {
	mapped := make(map[string]any)
	for k, v := range toPatch {
		mappedKey, ok := r.fMapper[k]
		if !ok {
			mappedKey = k.String()
		}
		mapped[mappedKey] = v
	}

	tx = r.queryApply(ctx, q, "")
	return tx.Model(model).Updates(mapped)
}

func filterOp(op filter.Operator) string {
	switch op {
	case filter.OpEq:
		return "="
	case filter.OpNEq:
		return "<>"
	case filter.OpGT:
		return ">"
	case filter.OpGTEq:
		return ">="
	case filter.OpLT:
		return "<"
	case filter.OpLTEq:
		return "<="
	case filter.OpIn:
		return "IN"
	case filter.OpNotIn:
		return "NOT IN"
	case filter.OpLike:
		return "LIKE"
	case filter.OpContainsLike:
		return "LIKE ANY"
	case filter.OpBetween:
		return "BETWEEN"
	case filter.OpContains:
		return "@>"
	case filter.OpIs:
		return "IS"
	case filter.OpIsNot:
		return "IS NOT"
	case filter.OpUndefined:
		panic(
			fields.NewErrInvalid(
				fields.NameOperator,
				fields.NewWrappedErr("operator %s is not supported", op),
			),
		)
	default:
		panic(
			fields.NewErrInvalid(
				fields.NameOperator,
				fields.NewWrappedErr("operator %s is not supported", op),
			),
		)
	}
}

func filterApply(tx *gorm.DB, columnMapper FieldColumnMapper, filters query.Filters[any], tableName string) *gorm.DB {
	if len(filters) < 1 {
		return tx
	}

	sqlQuery := strings.Builder{}
	args := []any{}

	// TODO: we need to improve this clause, it's being used so sqlmock tests assertions
	// https://linear.app/messagemycustomer/issue/MMC-451/[general]-migrate-db-tests-using-sqlmock-to-functional-tests
	// are consistent. The fieldFilter map cannot guarantee any consistent order (it's a map...),
	// so we need to sort and ensure alphabetical order in the sqlmocks (future work: tests arg assertions should not rely on a specific order)
	keys := maps.Keys(filters)
	sort.Strings(keys)
	for i, key := range keys {
		filt := filters[key]
		colName := columnMapper.Column(fields.Name(key))
		if tableName != "" && !strings.Contains(colName, ".") {
			colName = tableName + "." + colName
		}

		switch filt.Operator() {
		case filter.OpIs, filter.OpIsNot:
			if filt.Value() == nil {
				sqlQuery.WriteString(fmt.Sprintf("%s %s NULL", colName, filt.Operator().String()))
			} else {
				sqlQuery.WriteString(simpleArg(colName, filt.Operator()))
				args = append(args, filt.Value())
			}
		case filter.OpLike:
			sqlQuery.WriteString(simpleArg(colName, filt.Operator()))
			args = append(args, fmt.Sprintf("%%%v%%", filt.Value()))
		case filter.OpIn, filter.OpNotIn, filter.OpContainsLike:
			vals, ok := filt.Value().([]string) // Safe casting as of now since it will always be of type []string
			if !ok {
				// Cast slice to slice string
				inputVal := reflect.ValueOf(filt.Value())
				output := make([]string, inputVal.Len())
				for i := 0; i < inputVal.Len(); i++ {
					output[i] = fmt.Sprintf("%v", inputVal.Index(i).Interface())
				}
				vals = output
			}
			sqlQuery.WriteString(sliceArg(filt.Operator(), colName, vals))
			args = append(args, kslices.Map(vals, func(s string) any { return s })...)
		case filter.OpContains:
			sqlQuery.WriteString(simpleArg(colName, filt.Operator()))
			if kind := reflect.ValueOf(filt.Value()).Kind(); kind == reflect.Slice || kind == reflect.Array {
				args = append(args, pq.Array(filt.Value()))
			} else {
				args = append(args, pq.Array([]any{filt.Value()}))
			}
		case filter.OpBetween:
			vals := btwArgs(filt.Value())
			sqlQuery.WriteString(fmt.Sprintf("%s %s '%v' AND '%v'", colName, filt.Operator(), vals[0], vals[1]))
		default:
			sqlQuery.WriteString(simpleArg(colName, filt.Operator()))
			if kind := reflect.ValueOf(filt.Value()).Kind(); kind == reflect.Slice || kind == reflect.Array {
				args = append(args, pq.Array(filt.Value()))
			} else {
				args = append(args, filt.Value())
			}
		}

		if i < len(filters)-1 {
			sqlQuery.WriteString(" AND ")
		}
	}

	return tx.Where(sqlQuery.String(), args...)
}

func btwArgs(a any) []any {
	//nolint:gomnd //between will halways have 2 positions
	args := make([]any, 2)
	switch v := a.(type) {
	case []bool:
		for i := range v {
			args[i] = v[i]
		}
	case []float64:
		for i := range v {
			args[i] = v[i]
		}
	case []float32:
		for i := range v {
			args[i] = v[i]
		}
	case []int64:
		for i := range v {
			args[i] = v[i]
		}
	case []int32:
		for i := range v {
			args[i] = v[i]
		}
	case []string:
		for i := range v {
			args[i] = v[i]
		}
	case []time.Time:
		for i := range v {
			args[i] = v[i].Format("2006-01-02 15:04:05")
		}
	}

	return args
}

func simpleArg(colName string, operator filter.Operator) string {
	return fmt.Sprintf(
		"%s %s ?",
		colName,
		filterOp(operator),
	)
}

func sliceArg(operator filter.Operator, colName string, vals []string) string {
	subquery := strings.Builder{}
	if operator == filter.OpContainsLike {
		for i := 0; i < len(vals); i++ {
			subquery.WriteString("'%%%%' || ? || '%%%%'")
			if i < len(vals)-1 {
				subquery.WriteRune(',')
			}
		}
		return fmt.Sprintf(
			"EXISTS(SELECT FROM unnest(%s) cl_alias WHERE cl_alias %s(ARRAY[%s]))",
			colName,
			filterOp(operator),
			subquery.String(),
		)
	}
	for i := 0; i < len(vals); i++ {
		subquery.WriteString("?")
		if i < len(vals)-1 {
			subquery.WriteRune(',')
		}
	}

	return fmt.Sprintf(
		"%s %s (%s)",
		colName,
		filterOp(operator),
		subquery.String(),
	)
}

func sortingApply(tx *gorm.DB, columnMapper FieldColumnMapper, sorting *query.SortingParams) *gorm.DB {
	if sorting == nil {
		return tx
	}
	keys := sorting.Keys()
	if len(keys) < 1 {
		return tx
	}
	allParams := make([]string, len(keys))
	idx := 0
	for _, key := range keys {
		dir := sorting.Get(key)
		allParams[idx] = fmt.Sprintf("%s %s", columnMapper.Column(fields.Name(key)), dir)
		idx++
	}
	return tx.Order(strings.Join(allParams, ","))
}

func paginationApply(tx *gorm.DB, pagination *query.PaginationParams) *gorm.DB {
	tx = tx.Offset(pagination.Offset)
	if pagination.Limit > 0 {
		tx = tx.Limit(pagination.Limit)
	}

	return tx
}

type FieldColumnMapper map[fields.Name]string

func (m FieldColumnMapper) Column(field fields.Name) string {
	if val, found := m[field]; found && len(val) > 0 {
		return val
	}

	return field.String()
}

func NewRepo(db *gormcli.DBClient, fMapper map[fields.Name]string) (*Repo, error) {
	if db == nil {
		return nil, ErrPGMissingPGConn
	}
	if fMapper == nil {
		return nil, fields.NewErrInvalidNil(fields.NameMapper)
	}
	fieldMapper := maps.Clone(fMapper)

	return &Repo{
		DB:      db,
		fMapper: FieldColumnMapper(fieldMapper),
	}, nil
}
