package mock_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/gormdb"
	"github.com/dosanma1/forge/go/kit/persistence/gormdb/mock"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

func TestGormCliMock(t *testing.T) {
	m := mock.GormCli(
		t,
		mock.ValidateSchemaIsSet(`"schema_123456",public`),
		mock.GormCliOpts(
			gormdb.WithSQLConnectionOptions(sqldb.WithDBSchema("schema_123456")),
		),
	)

	assert.NotNil(t, m)
	assert.NotNil(t, m.DBClient)
	assert.NotNil(t, m.Sqlmock)
}
