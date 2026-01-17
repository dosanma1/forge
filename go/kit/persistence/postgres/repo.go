package postgres

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sort"
	"strings"
	"time"

	"golang.org/x/exp/maps"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"

	"github.com/dosanma1/forge/go/kit/application/repository"
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

// -----------------------------------------------------------------------------
// Public Methods
// -----------------------------------------------------------------------------

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



func (r *Repo) CountApply(ctx context.Context, model any, q query.Query) (tx *gorm.DB) {
	return r.countApply(ctx, model, q, "")
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

	tx = r.queryApply(ctx, q, "")
	return tx.Model(model).Updates(mapped)
}

// -----------------------------------------------------------------------------
// Private Methods
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Helpers: Locking
// -----------------------------------------------------------------------------

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

		if lock.Level() == repository.LockLevelRow {
			if lock.Contains(repository.LockModeExclusive) {
				s.lock = &clause.Locking{
					Strength: "UPDATE",
					Table:    clause.Table{Name: tableName},
				}
				return
			}
			panic("unexpected locking mode")
		}
		panic("unexpected locking level")
	}
}

// -----------------------------------------------------------------------------
// Helpers: Applying Filters, Sorting, Pagination
// -----------------------------------------------------------------------------

func filterApply(tx *gorm.DB, columnMapper map[string]string, filters query.Filters[any], tableName string) *gorm.DB {
	if len(filters) < 1 {
		return tx
	}

	sqlQuery := strings.Builder{}
	args := []any{}

	keys := maps.Keys(filters)
	sort.Strings(keys)
	for i, key := range keys {
		filt := filters[key]
		colName := columnMapper[key]
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

func sortingApply(tx *gorm.DB, columnMapper map[string]string, sorting *query.SortingParams) *gorm.DB {
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
		col := columnMapper[key]
		if col == "" {
			col = key
		}
		allParams[idx] = fmt.Sprintf("%s %s", col, dir)
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

func btwArgs(a any) []any {
	//nolint:gomnd //between will always have 2 positions
	args := make([]any, 2)
	
	val := reflect.ValueOf(a)
	if val.Kind() != reflect.Slice {
		return args
	}

	// Fast path for common types to avoid reflection overhead where possible, 
	// though we still need to assign to interface{} array.
	// For time.Time we need special formatting.
	switch v := a.(type) {
	case []time.Time:
		for i := range v {
			if i < 2 {
				args[i] = v[i].Format("2006-01-02 15:04:05")
			}
		}
		return args
	}

	// Generic handling
	for i := 0; i < val.Len() && i < 2; i++ {
		args[i] = val.Index(i).Interface()
	}
	return args
}

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------

// ErrDuplicateKey is the Postgres error code for unique constraint violation
const ErrDuplicateKey = "23505"

func ErrorIs(err error, code string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == code {
		return true
	}
	return false
}

func NewErrUnknown(err error) error {
	return apierrors.InternalError(fmt.Sprintf("query failed, please check the database adapter logs, %s", err.Error()))
}
