package sqldb

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"strings"
)

// ConnectionOption defines the contract for options applied to a sql.DB.
type ConnectionOption func(db *sql.DB) error

// WithMaxOpenLimit allows to set a maximum of open connections by the client.
func WithMaxOpenLimit(openConnsLimit int) ConnectionOption {
	return func(db *sql.DB) error {
		if openConnsLimit > 0 {
			db.SetMaxOpenConns(openConnsLimit)
		}

		return nil
	}
}

// WithMaxIdleConns allows to set a maximum of idle connections by the client.
func WithMaxIdleConns(idleConnsLimit int) ConnectionOption {
	return func(db *sql.DB) error {
		if idleConnsLimit > 0 {
			db.SetMaxIdleConns(idleConnsLimit)
		}

		return nil
	}
}

// WithDBSchema allows to set the db schema to be set when connecting to the database.
func WithDBSchema(schema string) ConnectionOption {
	return func(db *sql.DB) error {
		dbSchema := strings.TrimSpace(schema)
		if len(dbSchema) > 0 {
			_, err := db.Exec(fmt.Sprintf("SET SEARCH_PATH to %q,public", dbSchema))
			if err != nil {
				return err
			}
		}

		return nil
	}
}

// WithDBSchemaFromEnv allows to set the db schema to be set when connecting
// to the database by reading the DB_SCHEMA envvar (this is a default option).
func WithDBSchemaFromEnv() ConnectionOption {
	return WithDBSchema(os.Getenv("DB_SCHEMA"))
}

// Connect allows to connect to a sql.DB with the given connURL dsn.
func Connect(connURL *url.URL) (*sql.DB, error) {
	if connURL == nil || len(connURL.String()) < 1 {
		return nil, newErrConnEmptyDSN()
	}
	driverType := DriverType(connURL.Scheme)
	if !driverType.valid() {
		return nil, newErrConnInvalidDriver(driverType)
	}

	db, err := sql.Open(string(driverType), connURL.String())
	if err != nil {
		return nil, newErrConn(err)
	}

	return db, nil
}

// MustConnectWithDSN ensures a connection to a *sql.DB with the given dsn url,
// else it panics.
func MustConnectWithDSN(dsn *url.URL) *sql.DB {
	db, err := Connect(dsn)
	if err != nil {
		panic(err)
	}

	return db
}
