package pg

import (
	"bytes"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dosanma1/forge/go/kit/fields"
)

type SupportedExtension string

const (
	createEnum = `
		DO $$
		BEGIN
			IF NOT EXISTS (SELECT FROM pg_type WHERE typname = '%s') THEN
        		CREATE TYPE %q AS ENUM (%s);
    		END IF;
		END $$;
	`
	createSchema    = `CREATE SCHEMA IF NOT EXISTS %q;`
	createExtension = `CREATE EXTENSION IF NOT EXISTS %q SCHEMA %q;`
)

// CreateTypeFromEnumQuery returns a query to create a type in a PostgresSQL DB
// only if the type does not already exist.
func CreateTypeFromEnumQuery(name string, vals ...fmt.Stringer) (string, error) {
	if name == "" {
		return "", fields.NewErrInvalidEmptyString("name")
	}
	if len(vals) == 0 {
		return "", fields.NewErrInvalidNil("values")
	}
	values := make([]string, len(vals))
	for i := range vals {
		values[i] = vals[i].String()
	}

	if err := checkEmptyValues(values); err != nil {
		return "", err
	}
	return fmt.Sprintf(createEnum, name, name, valuesToQuery(values)), nil
}

func checkEmptyValues(values []string) (err error) {
	invalidValues := ""
	for i, v := range values {
		if v == "" {
			if invalidValues == "" {
				invalidValues = fmt.Sprintf("%s[%d]", "values", i)
			} else {
				invalidValues = fmt.Sprintf("%s,%s[%d]", invalidValues, "values", i)
			}
		}
	}
	if invalidValues == "" {
		return nil
	}
	return fields.NewErrInvalidEmptyString(fields.Name(invalidValues))
}

func valuesToQuery(values []string) string {
	var buffer bytes.Buffer

	for i, v := range values {
		if i == 0 {
			buffer.WriteString(fmt.Sprintf(`'%s'`, v))
		} else {
			buffer.WriteString(fmt.Sprintf(`, '%s'`, v))
		}
	}

	return buffer.String()
}

func CreateSchemaQuery(name string) (string, error) {
	if name == "" {
		return "", fields.NewErrInvalidEmptyString("name")
	}

	return fmt.Sprintf(createSchema, name), nil
}

func CreateExtensionQuery(extension SupportedExtension, schema string) (string, error) {
	if extension == "" {
		return "", fields.NewErrInvalidEmptyString("extension")
	}
	if schema == "" {
		return "", fields.NewErrInvalidEmptyString("schema")
	}
	return fmt.Sprintf(createExtension, extension, schema), nil
}

func ErrorIs(err error, code string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == code {
		return true
	}
	return false
}

func NullInt32FromString(s string) sql.NullInt32 {
	if s == "" {
		return sql.NullInt32{Valid: false}
	}
	val, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		return sql.NullInt32{Valid: false}
	}
	return sql.NullInt32{Int32: int32(val), Valid: true}
}

func TimePointerToPgTime(tp *time.Time) pgtype.Time {
	if tp == nil || tp.IsZero() {
		return pgtype.Time{Valid: false}
	}
	out := pgtype.Time{}
	err := out.Scan(tp.Format("15:04:05"))
	if err != nil {
		return pgtype.Time{Valid: false}
	}
	return out
}
