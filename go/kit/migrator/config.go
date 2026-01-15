package migrator

import (
	"fmt"
	"strings"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

// dbschemaConfig represents the database schema configuration
type dbschemaConfig string

// Decode decodes the schema configuration and adds default schemas
func (dsC *dbschemaConfig) Decode(value string) error {
	var (
		schema         = value
		defaultSchemas = []string{"public", "hstore"}
	)

	for _, defaultSchema := range defaultSchemas {
		if !strings.Contains(schema, defaultSchema) {
			schema = fmt.Sprintf("%s,%s", schema, defaultSchema)
		}
	}
	*dsC = dbschemaConfig(schema)

	return nil
}

func (dsC dbschemaConfig) String() string {
	return string(dsC)
}

// configuration holds all migration configuration
type configuration struct {
	DBSchema       dbschemaConfig `envconfig:"DB_SCHEMA"`
	ServiceName    string         `required:"true" envconfig:"SVC_NAME"`
	Environment    string         `default:"local" envconfig:"ENVIRONMENT"`
	LogLevel       string         `default:"INFO" envconfig:"LOG_LEVEL"`
	MigrateProject string         `required:"true" envconfig:"MIGRATE_PROJECT"`

	// Migration-specific flags (set by parseFlags)
	migrateDirection                   string
	forceExecutionPostMigrationScripts bool
	forceExecutionPreMigrationScripts  bool
}

// dsn generates the database connection string with schema search path
func (cfg *configuration) dsn() string {
	dsn, err := sqldb.NewDSN(sqldb.DriverTypePostgres)
	if err != nil {
		panic(fields.NewWrappedErr("error generating db DSN: %v", err))
	}

	return fmt.Sprintf("%s&search_path=%s", dsn.String(), cfg.DBSchema)
}
