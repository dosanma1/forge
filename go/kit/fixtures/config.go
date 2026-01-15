package fixtures

import (
	"errors"
	"fmt"
	"strings"
)

var (
	errSchemaWithPrefix = errors.New("schema with prefix not found")
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

// configuration holds all fixture configuration
type configuration struct {
	DBSchema    dbschemaConfig `envconfig:"DB_SCHEMA"`
	ServiceName string         `required:"true" envconfig:"SVC_NAME"`
	Environment string         `default:"local" envconfig:"ENVIRONMENT"`
	LogLevel    string         `default:"INFO" envconfig:"LOG_LEVEL"`

	dryRun bool
}

// fixturesFolder returns the fixtures directory path
func (cfg *configuration) fixturesFolder() string {
	return "fixtures"
}

// findSchemaWithPrefix finds the schema with the specified prefix
func findSchemaWithPrefix(schemaNames string) (string, error) {
	prefix := "tb_"
	schemas := strings.Split(schemaNames, ",")
	for _, schema := range schemas {
		trimmedSchema := strings.TrimSpace(schema)
		if strings.HasPrefix(trimmedSchema, prefix) {
			return trimmedSchema, nil
		}
	}
	return "", errSchemaWithPrefix
}
