package sqldb_test

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"

	otelsemconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

func TestNewTracingConfig(t *testing.T) {
	t.Parallel()

	system := persistence.DBSystem(string(otelsemconv.DBSystemMySQL.Key))
	dbName := "test_db"
	conn := &url.URL{
		Host:   "localhost:3306",
		Scheme: "mysql", User: url.UserPassword("test", "test"),
	}

	config := sqldb.NewTracingConfig(system, dbName, conn)

	assert.Equal(t, config.System(), system)
	assert.Equal(t, config.DBName(), dbName)
	assert.Equal(t, config.DBNameAttr(), sqldb.SpanAttrDBName)
	assert.Equal(t, config.TableNameAttr(), sqldb.SpanAttrTableName)
	assert.False(t, config.ExcludeQueryVars())
	assert.Equal(t, config.Conn(), conn)
}
