package postgres

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/lib/pq/hstore"

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

type ValidPointerTimestamps struct { // Public because GORM can't read private embedded structs
	ValidSince_ Time     `gorm:"column:valid_since;type:timestamp"`
	ValidUpTo_  NullTime `gorm:"column:valid_up_to;type:timestamp"`
}

func NewValidPointerTimestamps(validSince time.Time, validUpTo *time.Time) ValidPointerTimestamps {
	return ValidPointerTimestamps{
		ValidSince_: Time{Time: validSince},
		ValidUpTo_:  NewNullTime(validUpTo),
	}
}

func (d *ValidPointerTimestamps) ValidSince() time.Time {
	return d.ValidSince_.Time
}

func (d *ValidPointerTimestamps) ValidUpTo() *time.Time {
	return d.ValidUpTo_.OrNil()
}

type ValidTimestamps struct { // Public because GORM can't read private embedded structs
	ValidSince_ Time `gorm:"column:valid_since;type:timestamp"`
	ValidUpTo_  Time `gorm:"column:valid_up_to;type:timestamp"`
}

func NewValidTimestamps(validSince, validUpTo time.Time) ValidTimestamps {
	return ValidTimestamps{
		ValidSince_: Time{Time: validSince},
		ValidUpTo_:  Time{Time: validUpTo},
	}
}

func (d *ValidTimestamps) ValidSince() time.Time {
	return d.ValidSince_.Time
}

func (d *ValidTimestamps) ValidUpTo() time.Time {
	return d.ValidUpTo_.Time
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

type SerialModel32 struct { // Public because GORM can't read private embedded structs
	ID_ int32 `gorm:"column:id;primaryKey;autoIncrement:true"`
	Timestamps
}

func NewSerialModel32(id int32, createdAt, updatedAt time.Time, deletedAt *time.Time) SerialModel32 {
	return SerialModel32{
		ID_:        id,
		Timestamps: TimestampFromTimes(createdAt, updatedAt, deletedAt),
	}
}

func SerialModel32FromResource(r resource.Resource) SerialModel32 {
	if r.ID() == "" {
		return SerialModel32{}
	}
	id, err := strconv.ParseInt(r.ID(), 10, 32)
	if err != nil {
		panic(fmt.Sprintf("id %s is not int32", r.ID()))
	}
	return NewSerialModel32(int32(id), r.CreatedAt(), r.UpdatedAt(), r.DeletedAt())
}

func (d *SerialModel32) ID() int32 {
	return d.ID_
}

type CustomModel[T any] struct { // Public because GORM can't read private embedded structs
	ID_ T `gorm:"column:id;"`
	Timestamps
}

func NewCustomModel[T any](id T, createdAt, updatedAt time.Time, deletedAt *time.Time) CustomModel[T] {
	return CustomModel[T]{
		ID_:        id,
		Timestamps: TimestampFromTimes(createdAt, updatedAt, deletedAt),
	}
}

func CustomModelFromResource(r resource.Resource) CustomModel[string] {
	return NewCustomModel[string](r.ID(), r.CreatedAt(), r.UpdatedAt(), r.DeletedAt())
}

func Int32CustomModelFromResource(r resource.Resource) CustomModel[int32] {
	if r.ID() == "" {
		return CustomModel[int32]{}
	}
	id, err := strconv.ParseInt(r.ID(), 10, 32)
	if err != nil {
		panic(fmt.Sprintf("id %s is not int32", r.ID()))
	}
	return NewCustomModel[int32](int32(id), r.CreatedAt(), r.UpdatedAt(), r.DeletedAt())
}

func (d *CustomModel[T]) ID() T {
	return d.ID_
}

// -----------------------------------------------------------------------------
// Custom Postgres Types
// -----------------------------------------------------------------------------

// Point represents a geometric point
type Point struct {
	PointX, PointY float64
}

func (p Point) X() float64 {
	return p.PointX
}

func (p Point) Y() float64 {
	return p.PointY
}

func (p Point) Value() (driver.Value, error) {
	out := []byte{'('}
	out = strconv.AppendFloat(out, p.PointX, 'f', -1, 64)
	out = append(out, ',')
	out = strconv.AppendFloat(out, p.PointY, 'f', -1, 64)
	out = append(out, ')')
	return out, nil
}

func (p *Point) Scan(src interface{}) (err error) {
	var data []byte
	switch src := src.(type) {
	case []byte:
		data = src
	case string:
		data = []byte(src)
	case nil:
		return nil
	default:
		return errors.New("(*Point).Scan: unsupported data type")
	}

	if len(data) == 0 {
		return nil
	}

	data = data[1 : len(data)-1] // drop the surrounding parentheses
	for i := 0; i < len(data); i++ {
		if data[i] == ',' {
			if p.PointX, err = strconv.ParseFloat(string(data[:i]), 64); err != nil {
				return err
			}
			if p.PointY, err = strconv.ParseFloat(string(data[i+1:]), 64); err != nil {
				return err
			}
			break
		}
	}
	return nil
}

// Hstore wrapper for postgres hstore type
type Hstore map[string]*string

func (h Hstore) Value() (driver.Value, error) {
	if len(h) == 0 {
		return nil, nil // Return NULL for empty map instead of empty hstore
	}
	
	hstore := hstore.Hstore{Map: map[string]sql.NullString{}}
	for key, value := range h {
		var s sql.NullString
		if value != nil {
			s.String = *value
			s.Valid = true
		}
		hstore.Map[key] = s
	}
	return hstore.Value()
}

func (h *Hstore) Scan(value interface{}) error {
	hstore := hstore.Hstore{}

	if err := hstore.Scan(value); err != nil {
		return err
	}

	if len(hstore.Map) == 0 {
		return nil
	}

	*h = Hstore{}
	for k := range hstore.Map {
		if hstore.Map[k].Valid {
			s := hstore.Map[k].String
			(*h)[k] = &s
		} else {
			(*h)[k] = nil
		}
	}

	return nil
}

// Jsonb Postgresql's JSONB data type
type Jsonb struct {
	json.RawMessage
}

func (j Jsonb) Value() (driver.Value, error) {
	if len(j.RawMessage) == 0 {
		return nil, nil
	}
	return j.MarshalJSON()
}

func (j *Jsonb) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("Failed to unmarshal JSONB value:", value))
	}

	return json.Unmarshal(bytes, j)
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

func SerialIDFromString(id string) int32 {
	if id == "" {
		return 0
	}
	i, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		panic("id not int32")
	}
	return int32(i)
}

func NullSerialIDFromString(id string) *int32 {
	if id == "" {
		return nil
	}
	i, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		panic("id not int32")
	}
	ii := int32(i)
	return &ii
}

func JsonbFromStringMaps(m map[string]string) Jsonb {
	var err error
	h := Jsonb{}

	h.RawMessage, err = json.Marshal(m)
	if err != nil {
		panic(err)
	}

	return h
}
