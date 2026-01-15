package gormpg_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli/gormpg"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
	"github.com/dosanma1/forge/go/kit/search/query"
)

func TestNewClient(t *testing.T) {
	t.Setenv("DB_LOG_LEVEL", "debug")

	monitor := monitoring.New(loggertest.NewStubLogger(t), tracertest.NewRecorderTracer())

	cli, err := gormpg.NewClient(nil, monitor)
	assert.Nil(t, cli)
	assert.NotNil(t, err)
	connErr := new(sqldb.ConnectionErr)
	assert.ErrorAs(t, err, connErr)
	assert.Equal(t, err.Error(), "connection error: empty sql.DB connection handle")

	dsn := sqldb.MustGenerateDSN(
		sqldb.DriverTypePostgres,
		sqldb.WithConnDBName("abcdef"), sqldb.WithConnHost("ahostt"),
		sqldb.WithConnPort("4352"), sqldb.WithConnUser("testuser"),
		sqldb.WithConnPwd("apwd123"), sqldb.WithConnSSLMode("disable"),
	)

	cli, err = gormpg.NewClient(dsn, monitor)
	assert.NotNil(t, err)
	assert.Nil(t, cli)
}

func ExampleNewClient() {
	monitor := monitoring.New(logger.New(), tracertest.NewRecorderTracer())

	dsn := sqldb.MustGenerateDSN(
		sqldb.DriverTypePostgres,
		sqldb.WithConnDBName("testb_newcli"),
	)

	var cli sqldb.Client = gormcli.Must(
		gormpg.NewClient(
			dsn, monitor,
			gormcli.WithSQLConnectionOptions(
				sqldb.WithMaxOpenLimit(50),
				sqldb.WithMaxIdleConns(10),
				sqldb.WithDBSchema("test_db_schema_123"),
			),
			gormcli.WithSingularTable(false),
		),
	)
	cli.Close()
}

type testResource struct {
	pg.Model
	Name         string        `gorm:"column:name"`
	DependencyID *string       `gorm:"column:dependency_id;null"`
	Dependency   *testResource `gorm:"foreignkey:DependencyID"`
}

func TestRecursivePreload(t *testing.T) {
	// Setup
	db := pgtest.GetDB(t, pgtest.TestSchema)
	clearTestTable(t, db.DBClient)

	repo, err := pg.NewRepo(db.DBClient, map[fields.Name]string{})
	require.NoError(t, err)

	// Generate Data
	itemsNum := 10
	listResourcesCreated := createResources(itemsNum)
	ctx := context.TODO()

	for _, item := range listResourcesCreated {
		err := db.DBClient.WithContext(ctx).Create(&item).Error
		require.NoError(t, err)
	}

	var resList []testResource
	err = db.Find(&resList).Error
	require.NoError(t, err)

	assert.Len(t, resList, itemsNum)
	for k, r := range listResourcesCreated {
		assert.Equal(t, r.Name, resList[k].Name)
	}

	// Tests
	queryFilter := query.New(query.FilterBy(filter.OpEq, fields.NameID, listResourcesCreated[itemsNum-1].ID()))

	var res *testResource
	err = repo.QueryApply(ctx, queryFilter).Preload("Dependency", gormpg.PreloadRecursively("Dependency")).First(&res).Error
	require.NoError(t, err)

	AssertEqualTestResource(t, &listResourcesCreated[itemsNum-1], res)

	// Clean Up
	clearTestTable(t, db.DBClient)
}

// Helper funtions

func clearTestTable(t *testing.T, db *gormcli.DBClient) {
	t.Helper()

	err := db.Exec(`TRUNCATE "test_resource" CASCADE;`).Error
	require.NoError(t, err)
}

func newResourceStub(id string) resource.Resource {
	cTime := time.Now().UTC()
	return resourcetest.NewStub(
		resourcetest.WithID(id),
		resourcetest.WithCreatedAt(cTime),
		resourcetest.WithUpdatedAt(cTime.Add(1*time.Second)),
	)
}

func createResources(itemsNum int) []testResource {
	resArray := make([]testResource, itemsNum)
	for i := 0; i < itemsNum; i++ {
		stub := newResourceStub(uuid.NewString())
		resArray[i] = testResource{
			Model:        pg.ModelFromResource(stub),
			Name:         fmt.Sprintf("test %d", i+1),
			DependencyID: nil,
			Dependency:   nil,
		}

		if i != 0 { // root
			resArray[i].DependencyID = &resArray[i-1].ID_
			resArray[i].Dependency = &resArray[i-1]
		}
	}
	return resArray
}

func AssertEqualTestResource(t *testing.T, expected, actual *testResource) {
	t.Helper()

	if expected == nil {
		assert.Nil(t, actual)
		return
	}

	AssertEqualTestResource(t, expected.Dependency, actual.Dependency)
	assert.Equal(t, expected.Name, actual.Name)
	assert.Equal(t, expected.DependencyID, actual.DependencyID)
}
