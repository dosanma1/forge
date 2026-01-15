package pg_test

import (
	"database/sql"
	"database/sql/driver"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/gorm/dialects/postgres"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
)

func TestNewNullTime(t *testing.T) {
	t.Parallel()

	timeFixture := time.Now()
	tests := []struct {
		name string
		args *time.Time
		want pg.NullTime
	}{
		{
			name: "if time is nil, return empty null time",
			args: nil,
			want: pg.NullTime{NullTime: pq.NullTime{}},
		},
		{
			name: "if time is empty, return empty null time",
			args: &time.Time{},
			want: pg.NullTime{NullTime: pq.NullTime{}},
		},
		{
			name: "if time is valid, return valid null time",
			args: &timeFixture,
			want: pg.NullTime{NullTime: pq.NullTime{Valid: true, Time: timeFixture}},
		},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := pg.NewNullTime(tt.args)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestNullTimeOrNil(t *testing.T) {
	t.Parallel()

	timeFixture := time.Now()
	type args struct {
		nt pg.NullTime
	}
	tests := []struct {
		name string
		args args
		want *time.Time
	}{
		{
			name: "empty time",
			args: args{
				nt: pg.NewNullTime(nil),
			},
			want: nil,
		},
		{
			name: "zero time",
			args: args{
				nt: pg.NewNullTime(new(time.Time)),
			},
			want: nil,
		},
		{
			name: "not zero time",
			args: args{
				nt: pg.NewNullTime(&timeFixture),
			},
			want: &timeFixture,
		},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tt.args.nt.OrNil(), tt.want)
		})
	}
}

func TestNewModelFromResource(t *testing.T) {
	t.Parallel()

	stub := newResourceStub(uuid.NewString())
	item := pg.ModelFromResource(stub)

	assert.Equal(t, stub.ID(), item.ID())
	pgtest.AssertEqualTimestampsFromResource(t, stub, item.Timestamps)
}

func TestNewCustomModelFromResource(t *testing.T) {
	t.Parallel()

	stub := newResourceStub(uuid.NewString())
	item := pg.CustomModelFromResource(stub)

	assert.Equal(t, stub.ID(), item.ID())
	pgtest.AssertEqualTimestampsFromResource(t, stub, item.Timestamps)
}

func TestSerialModel64FromResource(t *testing.T) {
	t.Parallel()

	stub := newResourceStub("123")
	item := pg.SerialModelFromResource(stub)

	assert.Equal(t, stub.ID(), item.ID())
	pgtest.AssertEqualTimestampsFromResource(t, stub, item.Timestamps)
}

func TestSerialModelFromResource(t *testing.T) {
	t.Parallel()

	stub := newResourceStub("123")
	item := pg.SerialModel32FromResource(stub)

	assert.Equal(t, stub.ID(), item.ID())
	pgtest.AssertEqualTimestampsFromResource(t, stub, item.Timestamps)
}

func newResourceStub(id string) resource.Resource {
	cTime := time.Now().UTC()
	deletedAt := cTime.Add(2 * time.Second)
	return resourcetest.NewStub(
		resourcetest.WithID(id),
		resourcetest.WithCreatedAt(cTime),
		resourcetest.WithUpdatedAt(cTime.Add(1*time.Second)),
		resourcetest.WithDeletedAt(&deletedAt),
	)
}

func TestTimePGFormat(t *testing.T) {
	t.Parallel()

	pgtest.RunValuerPGFormattedTest(t,
		func(in time.Time) driver.Valuer { return pg.NewTime(in) },
	)

	scanner := new(pg.Time)
	pgtest.RunScannerPGFormattedTest(t,
		func() sql.Scanner { return scanner },
		func() time.Time { return scanner.Time },
	)
}

func TestNullTimePGFormat(t *testing.T) {
	t.Parallel()

	pgtest.RunValuerPGFormattedTest(t,
		func(in time.Time) driver.Valuer { return pg.NewNullTime(&in) },
	)

	scanner := new(pg.NullTime)
	pgtest.RunScannerPGFormattedTest(t,
		func() sql.Scanner { return scanner },
		func() time.Time { return scanner.Time },
	)
}

func TestDeletedAtTimePGFormat(t *testing.T) {
	t.Parallel()

	pgtest.RunValuerPGFormattedTest(t,
		func(in time.Time) driver.Valuer {
			return pg.DeletedAtTime{
				DeletedAt: gorm.DeletedAt(sql.NullTime{Valid: true, Time: in}),
			}
		},
	)

	scanner := new(pg.DeletedAtTime)
	pgtest.RunScannerPGFormattedTest(t,
		func() sql.Scanner { return scanner },
		func() time.Time { return scanner.Time },
	)
}

func TestNullSerialIDFromString(t *testing.T) {
	expected := int32(123)

	tests := []struct {
		name      string
		in        string
		want      *int32
		wantPanic bool
	}{
		{
			name: "an empty string should return nil",
			in:   "",
			want: nil,
		},
		{
			name: "a string containing a number should return the number",
			in:   "123",
			want: &expected,
		},
		{
			name:      "a string containing a non-number should panic",
			in:        "abc",
			wantPanic: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.wantPanic {
				defer func() {
					if r := recover(); r == nil {
						t.Errorf("expected panic but it didn't happen")
					}
				}()
			}

			got := pg.NullSerialIDFromString(tt.in)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestHstoreFromStringMaps(t *testing.T) {
	expected := postgres.Jsonb{
		RawMessage: []byte(`{"TEST":"test","TEST2":"test2"}`),
	}

	in := map[string]string{
		"TEST":  "test",
		"TEST2": "test2",
	}

	got := pg.JsonbFromStringMaps(in)
	assert.Equal(t, expected, got)
}
