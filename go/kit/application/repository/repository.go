package repository

import (
	"context"

	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search"
	"gorm.io/gorm"
)

type Creator[R resource.Resource] interface {
	Create(context.Context, R) (R, error)
}

type CreatorBatch[R resource.Resource] interface {
	CreateBatch(context.Context, []R) ([]R, error)
}

type Getter[R resource.Resource] interface {
	Get(ctx context.Context, opts ...search.Option) (R, error)
}

type Lister[R resource.Resource] interface {
	List(ctx context.Context, opts ...search.Option) (resource.ListResponse[R], error)
}

type Updater[R resource.Resource] interface {
	Update(context.Context, R) (R, error)
}

type Patcher[R resource.Resource] interface {
	Patch(context.Context, ...PatchOption) ([]R, error)
}

type Deleter interface {
	Delete(ctx context.Context, delType DeleteType, opts ...search.Option) error
}

type LockLevel string

const (
	LockLevelRow LockLevel = "ROW"
)

type LockMode string

const (
	LockModeExclusive LockMode = "EXCLUSIVE"
	LockModeShare     LockMode = "SHARE"
)

// Lock defines the interface for locking mechanisms.
type Lock interface {
	Modes() []LockMode
	Level() LockLevel
	Contains(mode LockMode) bool
}

type lock struct {
	lvl   LockLevel
	modes []LockMode
}

func (l *lock) Modes() []LockMode {
	return l.modes
}

func (l *lock) Level() LockLevel {
	return l.lvl
}

func (l *lock) Contains(mode LockMode) bool {
	for _, m := range l.modes {
		if m == mode {
			return true
		}
	}
	return false
}

// contextKeyType is a type for context key related to locking.
type contextKeyType int

const lockCtxKey contextKeyType = iota

// WithLockingCtx sets the lock context with the provided lock level and modes.
func WithLockingCtx(ctx context.Context, lockLevel LockLevel, lockModes ...LockMode) context.Context {
	return context.WithValue(ctx, lockCtxKey, &lock{lvl: lockLevel, modes: lockModes})
}

// LockFromCtx retrieves the lock from the context.
func LockFromCtx(ctx context.Context) Lock {
	lock := ctx.Value(lockCtxKey)
	if lock == nil {
		return nil
	}

	return lock.(Lock)
}

func AcquireAdvisoryLock(ctx context.Context, tx *gorm.DB, lockID int) error {
	return tx.WithContext(ctx).Exec("SELECT pg_advisory_lock(?);", lockID).Error
}

func ReleaseAdvisoryLock(ctx context.Context, tx *gorm.DB, lockID int) error {
	return tx.WithContext(ctx).Exec("SELECT pg_advisory_unlock(?);", lockID).Error
}
