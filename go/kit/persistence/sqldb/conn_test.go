package sqldb_test

import (
	"database/sql/driver"
	"net/url"
	"os"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

func TestOptions(t *testing.T) {
	defer os.Clearenv()

	t.Setenv("DB_SCHEMA", "test_schema")
	opts := append(
		[]sqldb.ConnectionOption{
			sqldb.WithDBSchemaFromEnv(),
			sqldb.WithMaxOpenLimit(100),
			sqldb.WithMaxIdleConns(25),
		},
		sqldb.WithMaxOpenLimit(10),
		sqldb.WithMaxIdleConns(8),
		sqldb.WithDBSchema("test_schema_2"),
	)

	db, mock, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
	assert.Nil(t, err)
	assert.NotNil(t, db)
	assert.NotNil(t, mock)
	mock.ExpectExec(`SET SEARCH_PATH to "test_schema"`).
		WillReturnResult(driver.ResultNoRows)
	mock.ExpectExec(`SET SEARCH_PATH to "test_schema_2"`).
		WillReturnResult(driver.ResultNoRows)
	defer db.Close()

	for _, opt := range opts {
		err := opt(db)
		assert.Nil(t, err)
	}
	assert.Equal(t, db.Stats().MaxOpenConnections, 10)
}

func TestConnectErrors(t *testing.T) {
	tests := []struct {
		name               string
		url                *url.URL
		expectedErrorTypes []error
		expectedErrStr     string
	}{
		{
			name:               "empty url",
			url:                &url.URL{},
			expectedErrorTypes: []error{new(sqldb.ConnectionErr)},
			expectedErrStr:     "connection error: empty dsn",
		},
		{
			name:               "invalid scheme",
			url:                &url.URL{Scheme: "http"},
			expectedErrorTypes: []error{new(sqldb.ConnectionErr)},
			expectedErrStr:     "connection error: driver type: http not supported, allowedValues: [postgres]",
		},
		{
			name: "db driver not imported",
			url: sqldb.MustGenerateDSN(
				sqldb.DriverTypePostgres,
				sqldb.WithConnHost("abffdde"),
				sqldb.WithConnPort("5499"),
				sqldb.WithConnUser("abedfe"),
				sqldb.WithConnPwd("1743o4949"),
				sqldb.WithConnDBName("hellotest"),
				sqldb.WithConnSSLMode("disable"),
			),
			expectedErrorTypes: []error{new(sqldb.ConnectionErr)},
			expectedErrStr:     `connection error: sql: unknown driver "postgres" (forgotten import?)`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, err := sqldb.Connect(test.url)
			assert.Nil(t, db)
			assert.Equal(t, err.Error(), test.expectedErrStr)
			for _, errType := range test.expectedErrorTypes {
				assert.ErrorAs(t, err, errType)
			}
			assert.Panics(t, func() { sqldb.MustConnectWithDSN(test.url) })
		})
	}
}
