package postgres

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/dosanma1/forge/go/kit/resource"
)

// -----------------------------------------------------------------------------
// Time Wrappers
// -----------------------------------------------------------------------------

type Time struct {
	time.Time
}

func (t *Time) Scan(value interface{}) error {
	switch v := value.(type) {
	case time.Time:
		t.Time = v
	case *time.Time:
		if v != nil {
			t.Time = *v
		} else {
			t.Time = time.Time{}
		}
	default:
		return fmt.Errorf("cannot scan type %T into Time", value)
	}
	return nil
}

func (t Time) Value() (driver.Value, error) {
	if t.Time.IsZero() {
		return nil, nil
	}
	return t.Time, nil
}

type NullTime struct {
	Time  time.Time
	Valid bool
}

func NewNullTime(t *time.Time) NullTime {
	if t == nil {
		return NullTime{}
	}
	return NullTime{
		Time:  *t,
		Valid: true,
	}
}

func (n *NullTime) Scan(value interface{}) error {
	if value == nil {
		n.Time, n.Valid = time.Time{}, false
		return nil
	}
	n.Valid = true
	switch v := value.(type) {
	case time.Time:
		n.Time = v
	case *time.Time:
		if v != nil {
			n.Time = *v
		} else {
			n.Valid = false
		}
	default:
		return fmt.Errorf("cannot scan type %T into NullTime", value)
	}
	return nil
}

func (n NullTime) Value() (driver.Value, error) {
	if !n.Valid {
		return nil, nil
	}
	return n.Time, nil
}

func (n NullTime) OrNil() *time.Time {
	if !n.Valid {
		return nil
	}
	return &n.Time
}

type DeletedAtTime struct {
	Time  time.Time
	Valid bool
}

func NewDeletedAtTime(t *time.Time) DeletedAtTime {
	nt := NewNullTime(t)
	return DeletedAtTime{Time: nt.Time, Valid: nt.Valid}
}

func (n *DeletedAtTime) Scan(value interface{}) error {
	return (*NullTime)(n).Scan(value)
}

func (n DeletedAtTime) Value() (driver.Value, error) {
	return (NullTime)(n).Value()
}

// -----------------------------------------------------------------------------
// Timestamp Structures
// -----------------------------------------------------------------------------

type Timestamps struct {
	CreatedAt_ Time          `gorm:"column:created_at;type:timestamp;autoCreateTime:true"`
	UpdatedAt_ Time          `gorm:"column:updated_at;type:timestamp;autoUpdateTime:true"`
	DeletedAt_ DeletedAtTime `gorm:"column:deleted_at;type:timestamp"`
}

func TimestampFromTimes(createdAt, updatedAt time.Time, deletedAt *time.Time) Timestamps {
	return Timestamps{
		CreatedAt_: Time{Time: createdAt},
		UpdatedAt_: Time{Time: updatedAt},
		DeletedAt_: NewDeletedAtTime(deletedAt),
	}
}

func (t *Timestamps) CreatedAt() time.Time {
	return t.CreatedAt_.Time
}

func (t *Timestamps) UpdatedAt() time.Time {
	return t.UpdatedAt_.Time
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

func NewModel(id string, createdAt, updatedAt time.Time, deletedAt *time.Time) Model {
	return Model{
		ID_:        id,
		Timestamps: TimestampFromTimes(createdAt, updatedAt, deletedAt),
	}
}

func ModelFromResource(r resource.Resource) Model {
	return NewModel(r.ID(), r.CreatedAt(), r.UpdatedAt(), r.DeletedAt())
}

func (d *Model) ID() string {
	return d.ID_
}

func (d *Model) LID() string {
	return ""
}
