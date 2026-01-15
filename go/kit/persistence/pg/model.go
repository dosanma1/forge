package pg

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jinzhu/gorm/dialects/postgres"
	"github.com/lib/pq"
	"github.com/lib/pq/hstore"
	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/resource"
)

// timePostgresUTC ensures the go time is in UTC and compliant
// with postgres timestamp (precision of microseconds)
func postgresUTCTime(t time.Time) time.Time {
	return t.UTC().Truncate(time.Microsecond)
}

type Time struct {
	time.Time
}

func NewTime(t time.Time) Time {
	return Time{Time: t}
}

func (t *Time) Scan(value any) error {
	source, ok := value.(time.Time)
	if !ok {
		return fields.NewErrInvalidType(fields.NameTime, time.Time{}, value)
	}
	if t == nil {
		t = new(Time)
	}
	*t = Time{Time: postgresUTCTime(source)}

	return nil
}

func (t Time) Value() (driver.Value, error) {
	return postgresUTCTime(t.Time), nil
}

type NullTime struct {
	pq.NullTime
}

func NewNullTime(t *time.Time) NullTime {
	pqTime := pq.NullTime{
		Valid: t != nil && !t.IsZero(),
	}
	if t != nil && !t.IsZero() {
		pqTime.Time = *t
	}

	return NullTime{NullTime: pqTime}
}

func (nt *NullTime) OrNil() *time.Time {
	if nt == nil || !nt.Valid || nt.Time.IsZero() {
		return nil
	}

	return &nt.Time
}

func (nt *NullTime) Scan(value any) error {
	wrapped := new(pq.NullTime)
	err := wrapped.Scan(value)
	if err != nil {
		return err
	}
	if nt == nil {
		nt = new(NullTime)
	}
	nt.NullTime = *wrapped
	if nt.Valid {
		nt.Time = postgresUTCTime(nt.Time)
	}

	return nil
}

func (nt NullTime) Value() (driver.Value, error) {
	if nt.Valid {
		nt.Time = postgresUTCTime(nt.Time)
	}

	return nt.NullTime.Value()
}

type DeletedAtTime struct {
	gorm.DeletedAt
}

func (dat *DeletedAtTime) Scan(value any) error {
	wrapped := new(gorm.DeletedAt)
	err := wrapped.Scan(value)
	if err != nil {
		return err
	}
	if dat == nil {
		dat = new(DeletedAtTime)
	}
	dat.DeletedAt = *wrapped
	if dat.Valid {
		dat.Time = postgresUTCTime(dat.Time)
	}

	return nil
}

func (dat DeletedAtTime) Value() (driver.Value, error) {
	if dat.Valid {
		dat.Time = postgresUTCTime(dat.Time)
	}

	return dat.DeletedAt.Value()
}

func TimestampFromTimes(createdAt, updatedAt time.Time, deletedAt *time.Time) Timestamps {
	return Timestamps{
		CreatedAt_: Time{Time: createdAt},
		UpdatedAt_: Time{Time: updatedAt},
		DeletedAt_: DeletedAtTime{
			DeletedAt: gorm.DeletedAt(NewNullTime(deletedAt).NullTime),
		},
	}
}

type SerialModel struct { // Public because GORM can't read private embedded structs
	ID_ int `gorm:"primaryKey;autoIncrement=false;column:id;type:serial"`
	Timestamps
}

func (d *SerialModel) ID() string {
	// For now we maintain the id as a string, but we use a serial column in the database.
	// We can change this when we migrate everything we want to migrate to serial columns.
	return strconv.Itoa(int(d.ID_))
}

func (d *SerialModel) LID() string {
	return ""
}

func NewSerialModel(id int, createdAt, updatedAt time.Time, deletedAt *time.Time) SerialModel {
	return SerialModel{
		ID_:        id,
		Timestamps: TimestampFromTimes(createdAt, updatedAt, deletedAt),
	}
}

func SerialModelFromResource(r resource.Resource) SerialModel {
	if r.ID() == "" {
		return SerialModel{}
	}

	id, err := strconv.ParseInt(r.ID(), 10, 64)
	if err != nil {
		panic("id not int64")
	}
	return NewSerialModel(int(id), r.CreatedAt(), r.UpdatedAt(), r.DeletedAt())
}

type SerialModel32 struct { // Public because GORM can't read private embedded structs
	ID_ int32 `gorm:"primaryKey;column:id;type:serial"`
	Timestamps
}

func (d *SerialModel32) ID() string {
	// For now we maintain the id as a string, but we use a serial column in the database.
	// We can change this when we migrate everything we want to migrate to serial columns.
	return strconv.Itoa(int(d.ID_))
}

func (d *SerialModel32) LID() string {
	return ""
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

type Timestamps struct {
	CreatedAt_ Time          `gorm:"column:created_at;type:timestamp;autoCreateTime:true"`
	UpdatedAt_ Time          `gorm:"column:updated_at;type:timestamp;autoUpdateTime:true"`
	DeletedAt_ DeletedAtTime `gorm:"column:deleted_at;type:timestamp"`
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

// TODO: improve and reuse this functionality in the places where it fits
// https://linear.app/messagemycustomer/issue/MMC-631/[general]-unify-and-use-validtimestamps

type ValidPointerTimestamps struct { // Public because GORM can't read private embedded structs
	ValidSince_ Time     `gorm:"column:valid_since;type:timestamp"`
	ValidUpTo_  NullTime `gorm:"column:valid_up_to;type:timestamp"`
}

func (d *ValidPointerTimestamps) ValidSince() time.Time {
	return d.ValidSince_.Time
}

func (d *ValidPointerTimestamps) ValidUpTo() *time.Time {
	return d.ValidUpTo_.OrNil()
}

func NewValidPointerTimestamps(validSince time.Time, validUpTo *time.Time) ValidPointerTimestamps {
	return ValidPointerTimestamps{
		ValidSince_: Time{Time: validSince},
		ValidUpTo_:  NewNullTime(validUpTo),
	}
}

type ValidTimestamps struct { // Public because GORM can't read private embedded structs
	ValidSince_ Time `gorm:"column:valid_since;type:timestamp"`
	ValidUpTo_  Time `gorm:"column:valid_up_to;type:timestamp"`
}

func (d *ValidTimestamps) ValidSince() time.Time {
	return d.ValidSince_.Time
}

func (d *ValidTimestamps) ValidUpTo() time.Time {
	return d.ValidUpTo_.Time
}

func NewValidTimestamps(validSince, validUpTo time.Time) ValidTimestamps {
	return ValidTimestamps{
		ValidSince_: Time{Time: validSince},
		ValidUpTo_:  Time{Time: validUpTo},
	}
}

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

func JsonbFromStringMaps(m map[string]string) postgres.Jsonb {
	var err error
	h := postgres.Jsonb{}

	h.RawMessage, err = json.Marshal(m)
	if err != nil {
		panic(err)
	}

	return h
}

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

type Hstore map[string]*string

// Value get value of Hstore
func (h Hstore) Value() (driver.Value, error) {
	hstore := hstore.Hstore{Map: map[string]sql.NullString{}}
	if len(h) == 0 {
		return nil, nil
	}

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

// Scan scan value into Hstore
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

// Value get value of Jsonb
func (j Jsonb) Value() (driver.Value, error) {
	if len(j.RawMessage) == 0 {
		return nil, nil
	}
	return j.MarshalJSON()
}

// Scan scan value into Jsonb
func (j *Jsonb) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("Failed to unmarshal JSONB value:", value))
	}

	return json.Unmarshal(bytes, j)
}
