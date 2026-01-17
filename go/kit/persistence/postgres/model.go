package postgres

import (
	"time"

	"github.com/dosanma1/forge/go/kit/resource"
	"gorm.io/gorm"
)

// -----------------------------------------------------------------------------
// Timestamp Structures
// -----------------------------------------------------------------------------

type Timestamps struct {
	CreatedAt_ time.Time      `gorm:"column:created_at;type:timestamp;autoCreateTime:true"`
	UpdatedAt_ time.Time      `gorm:"column:updated_at;type:timestamp;autoUpdateTime:true"`
	DeletedAt_ gorm.DeletedAt `gorm:"column:deleted_at;type:timestamp"`
}

func TimestampFromTimes(createdAt, updatedAt time.Time, deletedAt *time.Time) Timestamps {
	var delAt gorm.DeletedAt
	if deletedAt != nil {
		delAt.Time = *deletedAt
		delAt.Valid = true
	}
	return Timestamps{
		CreatedAt_: createdAt,
		UpdatedAt_: updatedAt,
		DeletedAt_: delAt,
	}
}

func (t *Timestamps) CreatedAt() time.Time {
	return t.CreatedAt_
}

func (t *Timestamps) UpdatedAt() time.Time {
	return t.UpdatedAt_
}

func (t *Timestamps) DeletedAt() *time.Time {
	if !t.DeletedAt_.Valid {
		return nil
	}
	return &t.DeletedAt_.Time
}

// -----------------------------------------------------------------------------
// Base Models
// -----------------------------------------------------------------------------

type Model struct { // Public because GORM can't read private embedded structs
	ID_ string `gorm:"column:id;type:uuid;default:uuid_generate_v4();primaryKey"`
	Timestamps
}

func (d *Model) ID() string {
	return d.ID_
}

func (d *Model) LID() string {
	return ""
}

func ModelFromResource(r resource.Resource) Model {
	return Model{
		ID_:        r.ID(),
		Timestamps: TimestampFromTimes(r.CreatedAt(), r.UpdatedAt(), r.DeletedAt()),
	}
}
