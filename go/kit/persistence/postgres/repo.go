package postgres

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/exp/maps"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/dosanma1/forge/go/kit/application/repository"
	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/gormdb"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search/query"
)

var (
	ErrDuplicateKey = errors.New("duplicate key")
)

type Model struct {
	EID        string         `gorm:"primaryKey;column:id"`
	ECreatedAt time.Time      `gorm:"column:created_at"`
	EUpdatedAt time.Time      `gorm:"column:updated_at"`
	EDeletedAt gorm.DeletedAt `gorm:"index;column:deleted_at"`
}

func (m Model) ID() string {
	return m.EID
}

func (m Model) CreatedAt() time.Time {
	return m.ECreatedAt
}

func (m Model) UpdatedAt() time.Time {
	return m.EUpdatedAt
}

func (m Model) DeletedAt() *time.Time {
	if m.EDeletedAt.Valid {
		t := m.EDeletedAt.Time
		return &t
	}
	return nil
}

func (m Model) LID() string {
	return ""
}

// Methods removed to avoid collision with embedded fields

type Repo struct {
	DB       *gormdb.DBClient
	fieldMap map[string]string
}

type queryApplySetup struct {
	lock *clause.Locking
}

type queryApplyOption func(*queryApplySetup)

// withLock applies database locking based on the lock information retrieved from the context.
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

func NewRepo(db *gormdb.DBClient, fieldMap map[string]string) (*Repo, error) {
	return &Repo{
		DB:       db,
		fieldMap: fieldMap,
	}, nil
}

func (r *Repo) QueryApply(ctx context.Context, q query.Query, ops ...queryApplyOption) *gorm.DB {
	return r.queryApply(ctx, q, "", ops...)
}

func (r *Repo) QueryApplyWithTableName(ctx context.Context, q query.Query, tableName string, ops ...queryApplyOption) *gorm.DB {
	return r.queryApply(ctx, q, tableName, ops...)
}

func (r *Repo) queryApply(ctx context.Context, q query.Query, tableName string, ops ...queryApplyOption) *gorm.DB {
	ops = append(ops, withLock(ctx, tableName))

	s := new(queryApplySetup)
	for _, v := range ops {
		v(s)
	}

	tx := r.DB.WithContext(ctx)
	if q == nil {
		return tx
	}

	tx = r.applyFilters(tx, q.Filters(), tableName)
	tx = r.applySorting(tx, q.Sorting())
	tx = r.applyPagination(tx, q.Pagination())

	if s.lock != nil {
		tx = tx.Clauses(s.lock)
	}

	return tx
}

func (r *Repo) CountApply(ctx context.Context, model interface{}, q query.Query) *gorm.DB {
	return r.countApply(ctx, model, q, "")
}

func (r *Repo) CountApplyWithTableName(ctx context.Context, model interface{}, q query.Query, tableName string) *gorm.DB {
	return r.countApply(ctx, model, q, tableName)
}

func (r *Repo) countApply(ctx context.Context, model interface{}, q query.Query, tableName string) *gorm.DB {
	tx := r.DB.WithContext(ctx).Model(model)
	if q == nil {
		return tx
	}
	if tableName != "" {
		tx = tx.Table(tableName)
	}
	return r.applyFilters(tx, q.Filters(), tableName)
}

func (r *Repo) PatchApply(ctx context.Context, q query.Query, model interface{}, patchFields map[string]interface{}) *gorm.DB {
	db := r.DB.WithContext(ctx).Model(model)
	db = r.applyFilters(db, q.Filters(), "")

	updates := make(map[string]interface{})
	for field, val := range patchFields {
		dbCol, ok := r.fieldMap[field]
		if !ok {
			dbCol = field
		}
		updates[dbCol] = val
	}

	if len(updates) == 0 {
		return db
	}

	return db.Updates(updates)
}

func (r *Repo) Commit() error {
	return r.DB.Commit().Error
}

func (r *Repo) Rollback() error {
	return r.DB.Rollback().Error
}

func (r *Repo) applyQuery(db *gorm.DB, q query.Query) *gorm.DB {
	db = r.applyFilters(db, q.Filters(), "") // Original call, now passing empty tableName
	db = r.applySorting(db, q.Sorting())
	db = r.applyPagination(db, q.Pagination())
	return db
}

func (r *Repo) applyFilters(db *gorm.DB, filters query.Filters[any], tableName string) *gorm.DB {
	// Sort filters for consistent SQL generation (useful for testing)
	keys := maps.Keys(filters)
	sort.Strings(keys)

	for _, key := range keys {
		f := filters[key]
		dbCol := r.mapField(key)
		
		if tableName != "" && !strings.Contains(dbCol, ".") {
			dbCol = tableName + "." + dbCol
		}

		val := f.Value()

		switch f.Operator() {
		case filter.OpEq:
			db = db.Where(fmt.Sprintf("%s = ?", dbCol), val)
		case filter.OpNEq:
			db = db.Where(fmt.Sprintf("%s <> ?", dbCol), val)
		case filter.OpGT:
			db = db.Where(fmt.Sprintf("%s > ?", dbCol), val)
		case filter.OpGTEq:
			db = db.Where(fmt.Sprintf("%s >= ?", dbCol), val)
		case filter.OpLT:
			db = db.Where(fmt.Sprintf("%s < ?", dbCol), val)
		case filter.OpLTEq:
			db = db.Where(fmt.Sprintf("%s <= ?", dbCol), val)
		case filter.OpIn:
			db = db.Where(fmt.Sprintf("%s IN (?)", dbCol), val)
		case filter.OpNotIn:
			db = db.Where(fmt.Sprintf("%s NOT IN (?)", dbCol), val)
		case filter.OpLike:
			db = db.Where(fmt.Sprintf("%s LIKE ?", dbCol), val)
		case filter.OpContainsLike:
			// Custom logic for ContainsLike/SliceArg from legacy but adapted to Gorm
			vals, ok := val.([]string)
			if !ok {
				valsStr := []string{}
				valRef := reflect.ValueOf(val)
				if valRef.Kind() == reflect.Slice {
					for i := 0; i < valRef.Len(); i++ {
						valsStr = append(valsStr, fmt.Sprintf("%v", valRef.Index(i).Interface()))
					}
				}
				vals = valsStr
			}
			
			subquery := strings.Builder{}
			for i := 0; i < len(vals); i++ {
				subquery.WriteString("'%%%%' || ? || '%%%%'")
				if i < len(vals)-1 {
					subquery.WriteRune(',')
				}
			}
			query := fmt.Sprintf(
				"EXISTS(SELECT FROM unnest(%s) cl_alias WHERE cl_alias LIKE ANY(ARRAY[%s]))",
				dbCol,
				subquery.String(),
			)
			// Need to flatten args
			flatArgs := []interface{}{}
			for _, v := range vals {
				flatArgs = append(flatArgs, v)
			}
			db = db.Where(query, flatArgs...)

		case filter.OpIs:
			if val == nil {
				db = db.Where(fmt.Sprintf("%s IS NULL", dbCol))
			} else {
				db = db.Where(fmt.Sprintf("%s IS ?", dbCol), val)
			}
		case filter.OpIsNot:
			if val == nil {
				db = db.Where(fmt.Sprintf("%s IS NOT NULL", dbCol))
			} else {
				db = db.Where(fmt.Sprintf("%s IS NOT ?", dbCol), val)
			}
		case filter.OpContains:
			db = db.Where(fmt.Sprintf("%s @> ?", dbCol), val)
		}
	}
	return db
}

func (r *Repo) applySorting(db *gorm.DB, sorting *query.SortingParams) *gorm.DB {
	if sorting == nil {
		return db
	}
	for _, key := range sorting.Keys() {
		dir := sorting.Get(key)
		if !dir.Valid() {
			continue
		}
		dbCol := r.mapField(key)
		db = db.Order(fmt.Sprintf("%s %s", dbCol, dir.String()))
	}
	return db
}

func (r *Repo) applyPagination(db *gorm.DB, p *query.PaginationParams) *gorm.DB {
	if p == nil {
		return db
	}
	if p.Limit > 0 {
		db = db.Limit(p.Limit)
	}
	if p.Offset > 0 {
		db = db.Offset(p.Offset)
	}
	return db
}

func (r *Repo) mapField(field string) string {
	if mapped, ok := r.fieldMap[field]; ok {
		return mapped
	}
	return field
}

func ModelFromResource(res resource.Resource) Model {
	return Model{
		EID:        res.ID(),
		ECreatedAt: res.CreatedAt(),
	}
}

func ErrorIs(err error, target error) bool {
	if errors.Is(err, target) {
		return true
	}
	
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if target == ErrDuplicateKey && pgErr.Code == pgerrcode.UniqueViolation {
			return true
		}
	}
	return false
}

func NewErrUnknown(err error) error {
    return apierrors.InternalError(err.Error())
}
