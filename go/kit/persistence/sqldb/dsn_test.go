package sqldb_test

import (
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

func TestNewDSNOK(t *testing.T) {
	defer os.Clearenv()

	hostVal := "sqlmock_db_1324"
	portVal := "5432"
	dbName := "test_db"
	dbUser := "test_user"
	dbPwd := "test1234"
	dbSSL := "enable"

	tests := []struct {
		name          string
		driverType    sqldb.DriverType
		before        func()
		options       []sqldb.ConnectionDSNOption
		expectedInDSN []string
	}{
		{
			name:       "config from env",
			driverType: sqldb.DriverTypePostgres,
			before: func() {
				t.Setenv("DB_HOST", hostVal)
				t.Setenv("DB_PORT", portVal)
				t.Setenv("DB_NAME", dbName)
				t.Setenv("DB_USER", dbUser)
				t.Setenv("DB_PASSWORD", dbPwd)
				t.Setenv("DB_SSL", dbSSL)
			},
			expectedInDSN: []string{
				"postgres://",
				fmt.Sprintf("%s:%s", hostVal, portVal),
				fmt.Sprintf("%s:%s@", dbUser, dbPwd),
				fmt.Sprintf("/%s?", dbName),
				fmt.Sprintf("sslmode=%s", dbSSL),
			},
		},
		{
			name:       "overriding envvars",
			driverType: sqldb.DriverTypePostgres,
			options: []sqldb.ConnectionDSNOption{
				sqldb.WithConnPort("1344"),
				sqldb.WithConnUser("abcdefg"),
				sqldb.WithConnPwd("5739"),
				sqldb.WithConnHost("ahost"),
				sqldb.WithConnDBName("adb"),
				sqldb.WithConnSSLMode("disable"),
			},
			expectedInDSN: []string{
				"postgres://",
				fmt.Sprintf("%s:%s", "ahost", "1344"),
				fmt.Sprintf("%s:%s@", "abcdefg", "5739"),
				fmt.Sprintf("/%s?", "adb"),
				fmt.Sprintf("sslmode=%s", "disable"),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.before != nil {
				test.before()
			}
			dsn, err := sqldb.NewDSN(test.driverType, test.options...)
			assert.Nil(t, err)
			for _, expectedField := range test.expectedInDSN {
				assert.Contains(t, dsn.String(), expectedField)
			}
		})
	}
}

func TestNewDSNErrors(t *testing.T) {
	tests := []struct {
		name             string
		driverType       sqldb.DriverType
		before           func()
		options          []sqldb.ConnectionDSNOption
		expectedErrTypes []error
		errVal           string
	}{
		{
			name:       "unknown driver type",
			driverType: sqldb.DriverType("unknown"),
			expectedErrTypes: []error{
				new(sqldb.ConnectionErr),
			},
			errVal: "connection error: driver type: unknown not supported, allowedValues: [postgres]",
		},
		{
			name: "empty dsn options",
			options: []sqldb.ConnectionDSNOption{
				sqldb.WithConnHost(""), sqldb.WithConnPort(""),
				sqldb.WithConnDBName(""), sqldb.WithConnPwd(""),
				sqldb.WithConnSSLMode(""), sqldb.WithConnUser(""),
			},
			driverType: sqldb.DriverTypePostgres,
			expectedErrTypes: []error{
				new(sqldb.ConnectionErr),
				new(sqldb.EmptyDSNFieldErr),
			},
			errVal: "connection error: empty dsn field host",
		},
		{
			name:       "empty conn field must err",
			driverType: sqldb.DriverTypePostgres,
			expectedErrTypes: []error{
				new(sqldb.ConnectionErr),
				new(sqldb.EmptyDSNFieldErr),
			},
			options: []sqldb.ConnectionDSNOption{
				sqldb.WithConnPort("1344"),
				sqldb.WithConnUser("abcdefg"),
				sqldb.WithConnHost("ahost"),
				sqldb.WithConnDBName("adb"),
				sqldb.WithConnSSLMode("disable"),
				sqldb.WithConnPwd(""),
			},
			errVal: "connection error: empty dsn field password",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.before != nil {
				test.before()
			}
			dsn, err := sqldb.NewDSN(test.driverType, test.options...)
			assert.NotNil(t, err)
			assert.Nil(t, dsn)

			for _, expErrType := range test.expectedErrTypes {
				assert.ErrorAs(t, err, expErrType)
			}
			assert.Equal(t, err.Error(), test.errVal)

			assert.Panics(t, func() {
				sqldb.MustGenerateDSN(test.driverType, test.options...)
			})
		})
	}
}
