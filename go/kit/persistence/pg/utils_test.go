package pg_test

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
)

const (
	expectedCreateTypeResult = `
		DO $$
		BEGIN
			IF NOT EXISTS (SELECT FROM pg_type WHERE typname = '%s') THEN
        		CREATE TYPE %q AS ENUM (%s);
    		END IF;
		END $$;
	`
)

type stringishStr string

func (s stringishStr) String() string {
	return string(s)
}

func TestCreateTypeFromEnumQuery(t *testing.T) {
	type args struct {
		name   string
		values []stringishStr
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr error
	}{
		{
			name: "empty name",
			args: args{
				name:   "",
				values: []stringishStr{},
			},
			want:    "",
			wantErr: fields.NewErrInvalidEmptyString("name"),
		},
		{
			name: "nil enum",
			args: args{
				name:   "test_type",
				values: nil,
			},
			want:    "",
			wantErr: fields.NewErrInvalidNil("values"),
		},
		{
			name: "empty enum",
			args: args{
				name:   "test_type",
				values: []stringishStr{},
			},
			want:    "",
			wantErr: fields.NewErrInvalidNil("values"),
		},
		{
			name: "empty enum item",
			args: args{
				name:   "test_type",
				values: []stringishStr{"test_value", ""},
			},
			want:    "",
			wantErr: fields.NewErrInvalidEmptyString("values[1]"),
		},
		{
			name: "single value enum",
			args: args{
				name:   "test_type",
				values: []stringishStr{"test_value"},
			},
			want:    fmt.Sprintf(expectedCreateTypeResult, "test_type", "test_type", `'test_value'`),
			wantErr: nil,
		},
		{
			name: "multiple value enum",
			args: args{
				name:   "test_type",
				values: []stringishStr{"test_value_1", "test_value_2"},
			},
			want:    fmt.Sprintf(expectedCreateTypeResult, "test_type", "test_type", `'test_value_1', 'test_value_2'`),
			wantErr: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vals := make([]fmt.Stringer, len(tt.args.values))
			for i := range tt.args.values {
				vals[i] = tt.args.values[i]
			}
			got, err := pg.CreateTypeFromEnumQuery(tt.args.name, vals...)
			if err != nil && !errors.Is(err, tt.wantErr) {
				t.Errorf("pgutil.CreateTypeFromEnumQuery() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("pgutil.CreateTypeFromEnumQuery() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCreateSchemaQuery(t *testing.T) {
	type args struct {
		name string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr error
	}{
		{
			name:    "empty schema name",
			args:    args{name: ""},
			want:    "",
			wantErr: fields.NewErrInvalidEmptyString("name"),
		},
		{
			name:    "valid name",
			args:    args{name: "test_schema"},
			want:    `CREATE SCHEMA IF NOT EXISTS "test_schema";`,
			wantErr: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := pg.CreateSchemaQuery(tt.args.name)
			if err != nil && !errors.Is(err, tt.wantErr) {
				t.Errorf("CreateSchemaQuery() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("CreateSchemaQuery() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestErrorIs(t *testing.T) {
	type args struct {
		err  error
		code string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "if error has a different type return false",
			args: args{
				err:  assert.AnError,
				code: "test_code",
			},
			want: false,
		},
		{
			name: "if type is pgError and error code is different return false",
			args: args{
				err:  &pgconn.PgError{Code: "missmatch_code"},
				code: "test_code",
			},
			want: false,
		},
		{
			name: "if type is pgError and error code is equal return true",
			args: args{
				err:  &pgconn.PgError{Code: "test_code"},
				code: "test_code",
			},
			want: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := pg.ErrorIs(tt.args.err, tt.args.code); got != tt.want {
				t.Errorf("IsError() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestPointerToPgTime(t *testing.T) {
	timeFixture := time.Date(2022, 1, 1, 15, 36, 39, 0, time.UTC)
	tests := []struct {
		name string
		in   *time.Time
		want pgtype.Time
	}{
		{
			name: "if input is a nil pointer, return a null time",
			in:   nil,
			want: pgtype.Time{},
		},
		{
			name: "if input is a valid pointer, return a valid time",
			in:   &timeFixture,
			want: pgtype.Time{
				Microseconds: 56199000000,
				Valid:        true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pg.TimePointerToPgTime(tt.in)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestNullInt32FromString(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  sql.NullInt32
	}{
		{
			name:  "given an empty string, return not valid value",
			input: "",
			want:  sql.NullInt32{Valid: false},
		},
		{
			name:  "given a not number string, when it's called then it returns a not valid value",
			input: "invalid",
			want:  sql.NullInt32{Valid: false},
		},
		{
			name:  "given a valid int32 string, when it's called then it returns it as a valid sql.NullInt32",
			input: "10",
			want:  sql.NullInt32{Valid: true, Int32: int32(10)},
		},
	}
	for _, tt := range tests {
		got := pg.NullInt32FromString(tt.input)
		assert.Equal(t, tt.want, got)
	}
}
