package postgres

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sort"
	"strings"

	"golang.org/x/exp/maps"
	"gorm.io/gorm"

	"github.com/lib/pq"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/gormdb"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/slicesx"
)

type Repo struct {
	DB      *gormdb.DBClient
	fMapper map[string]string
}

func NewRepo(db *gormdb.DBClient, fMapper map[string]string) (*Repo, error) {
	if db == nil {
		return nil, errors.New("missing db client")
	}
	if fMapper == nil {
		return nil, errors.New("missing field map")
	}
	fieldMapper := maps.Clone(fMapper)

	return &Repo{
		DB:      db,
		fMapper: fieldMapper,
	}, nil
}

func (r *Repo) FMapper() map[string]string {
	return r.fMapper
}

func (r *Repo) Commit() error {
	return r.DB.Commit().Error
}

func (r *Repo) Rollback() error {
	return r.DB.Rollback().Error
}

func (r *Repo) QueryApply(ctx context.Context, q query.Query, ops ...queryApplyOption) (tx *gorm.DB) {
	return r.queryApply(ctx, q, "", ops...)
}

func (r *Repo) QueryApplyWithTableName(ctx context.Context, q query.Query, tableName string, ops ...queryApplyOption) (tx *gorm.DB) {
	return r.queryApply(ctx, q, tableName, ops...)
}

func (r *Repo) CountApply(ctx context.Context, model any, q query.Query) (tx *gorm.DB) {
	return r.countApply(ctx, model, q, "")
}

func (r *Repo) CountApplyWithTableName(ctx context.Context, model any, q query.Query, tableName string) (tx *gorm.DB) {
	return r.countApply(ctx, model, q, tableName)
}

func (r *Repo) PatchApply(ctx context.Context, q query.Query, model any, toPatch map[string]any) (tx *gorm.DB) {
	mapped := make(map[string]any, len(toPatch))
	for k, v := range toPatch {
		mappedKey, ok := r.fMapper[k]
		if !ok {
			mappedKey = k
		}
		mapped[mappedKey] = v
	}

	return r.
		queryApply(ctx, q, "").
		Model(model).
		Updates(mapped)
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
	tx = r.filterApply(tx, q.Filters(), tableName)
	tx = r.sortingApply(tx, q.Sorting())
	if q.Pagination() != nil {
		tx = r.paginationApply(tx, q.Pagination())
	}
	if s.lock != nil {
		tx = tx.Clauses(s.lock)
	}

	return
}

func (r *Repo) countApply(ctx context.Context, model any, q query.Query, tableName string) (tx *gorm.DB) {
	tx = r.DB.WithContext(ctx).Model(model)
	if q == nil {
		return
	}
	if tableName != "" {
		tx = tx.Table(tableName)
	}
	tx = r.filterApply(tx, q.Filters(), tableName)

	return
}

func (r *Repo) filterApply(tx *gorm.DB, filters query.Filters[any], tableName string) *gorm.DB {
	if len(filters) < 1 {
		return tx
	}

	sqlQuery := strings.Builder{}
	args := []any{}

	keys := maps.Keys(filters)
	sort.Strings(keys)
	for i, key := range keys {
		filt := filters[key]
		colName := r.fMapper[key]
		if colName == "" {
			colName = key
		}

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
				if inputVal.Kind() == reflect.Slice {
					output := make([]string, inputVal.Len())
					for i := 0; i < inputVal.Len(); i++ {
						output[i] = fmt.Sprintf("%v", inputVal.Index(i).Interface())
					}
					vals = output
				}
			}
			sqlQuery.WriteString(sliceArg(filt.Operator(), colName, vals))
			args = append(args, slicesx.Map(vals, func(s string) any { return s })...)
		case filter.OpContains:
			sqlQuery.WriteString(simpleArg(colName, filt.Operator()))
			if kind := reflect.ValueOf(filt.Value()).Kind(); kind == reflect.Slice || kind == reflect.Array {
				args = append(args, pq.Array(filt.Value()))
			} else {
				args = append(args, pq.Array([]any{filt.Value()}))
			}
		case filter.OpBetween:
			vals := btwArgs(filt.Value())
			sqlQuery.WriteString(fmt.Sprintf("%s %s ? AND ?", colName, filt.Operator()))
			args = append(args, vals...)
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

func (r *Repo) sortingApply(tx *gorm.DB, sorting *query.SortingParams) *gorm.DB {
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
		col := r.fMapper[key]
		if col == "" {
			col = key
		}
		allParams[idx] = fmt.Sprintf("%s %s", col, dir)
		idx++
	}
	return tx.Order(strings.Join(allParams, ","))
}

func (r *Repo) paginationApply(tx *gorm.DB, pagination *query.PaginationParams) *gorm.DB {
	tx = tx.Offset(pagination.Offset)
	if pagination.Limit > 0 {
		tx = tx.Limit(pagination.Limit)
	}

	return tx
}

// -----------------------------------------------------------------------------
// Helpers: Usage
// -----------------------------------------------------------------------------

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
	default:
		panic(apierrors.InternalError(fmt.Sprintf("operator %s is not supported", op)))
	}
}

func simpleArg(colName string, operator filter.Operator) string {
	return fmt.Sprintf("%s %s ?", colName, filterOp(operator))
}

func sliceArg(operator filter.Operator, colName string, vals []string) string {
	subquery := strings.Builder{}
	if operator == filter.OpContainsLike {
		for i := 0; i < len(vals); i++ {
			subquery.WriteString("'%' || ? || '%'")
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

func btwArgs(a any) []any {
	args := make([]any, 2)

	val := reflect.ValueOf(a)
	if val.Kind() != reflect.Slice {
		return args
	}

	// Generic handling
	for i := 0; i < val.Len() && i < 2; i++ {
		args[i] = val.Index(i).Interface()
	}
	return args
}
