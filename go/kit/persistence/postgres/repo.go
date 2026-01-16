package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"

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

func NewRepo(db *gormdb.DBClient, fieldMap map[string]string) (*Repo, error) {
	return &Repo{
		DB:       db,
		fieldMap: fieldMap,
	}, nil
}

func (r *Repo) QueryApply(ctx context.Context, q query.Query) *gorm.DB {
	db := r.DB.WithContext(ctx)
	return r.applyQuery(db, q)
}

func (r *Repo) CountApply(ctx context.Context, model interface{}, q query.Query) *gorm.DB {
	db := r.DB.WithContext(ctx).Model(model)
	return r.applyFilters(db, q.Filters())
}

func (r *Repo) PatchApply(ctx context.Context, q query.Query, model interface{}, patchFields map[string]interface{}) *gorm.DB {
	db := r.DB.WithContext(ctx).Model(model)
	db = r.applyFilters(db, q.Filters())

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

func (r *Repo) applyQuery(db *gorm.DB, q query.Query) *gorm.DB {
	db = r.applyFilters(db, q.Filters())
	db = r.applySorting(db, q.Sorting())
	db = r.applyPagination(db, q.Pagination())
	return db
}

func (r *Repo) applyFilters(db *gorm.DB, filters query.Filters[any]) *gorm.DB {
	for name, f := range filters {
		dbCol := r.mapField(name)
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
