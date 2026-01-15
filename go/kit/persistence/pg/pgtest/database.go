package pgtest

import (
	"fmt"
	"net/url"
	"path"
	"path/filepath"
	"runtime"
	"sort"
	"sync"
	"testing"
	"time"

	"github.com/orlangure/gnomock"
	"github.com/orlangure/gnomock/preset/postgres"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli/gormpg"
)

type SchemaName string

func (s SchemaName) String() string {
	return string(s)
}

const (
	TestSchema SchemaName = "test"
)

const (
	backDir = ".."
)

var (
	//nolint: gochecknoglobals // singleton
	database *testDB
	//nolint: gochecknoglobals // singleton
	once sync.Once
)

const (
	testDBUser     = "gnomock"
	testDBPassword = "gnomick"
	testDBName     = "db"
)

type testDBConfig struct {
	schemaMigrationFolderPath string
	migrationFolderPath       string
}

type testDBConfigOptions func(*testDBConfig)

func testDBConfigDefaultOptions() []testDBConfigOptions {
	return []testDBConfigOptions{
		TestDBConfigWithSchemaMigrationsFolderPath(getSchemaMigrationFolder()),
		TestDBConfigWithMigrationsFolderPath(getMigrationsFolder()),
	}
}

func TestDBConfigWithSchemaMigrationsFolderPath(path string) testDBConfigOptions {
	return func(td *testDBConfig) {
		td.schemaMigrationFolderPath = path
	}
}

func TestDBConfigWithMigrationsFolderPath(path string) testDBConfigOptions {
	return func(td *testDBConfig) {
		td.migrationFolderPath = path
	}
}

type testDB struct {
	*gormcli.DBClient
	Host     string
	Port     int
	Schema   string
	DBName   string
	User     string
	Password string
}

func GetDB(t *testing.T, schema SchemaName, opts ...testDBConfigOptions) *testDB {
	t.Helper()

	t.Setenv("DB_LOG_LEVEL", "debug")

	once.Do(
		func() {
			loggerInstance := logger.New(
				logger.WithType(logger.ZapLogger),
				logger.WithLevel(logger.LogLevelDebug),
			)
			monitor := monitoring.New(loggerInstance, tracertest.NewRecorderTracer())
			database = helperCreatePGSQLContainer(schema, monitor, opts...)
		})

	return database
}

func GetNowTime() time.Time {
	return time.Now().UTC().Truncate(time.Microsecond)
}

func getMigrationsFolder() string {
	_, filename, _, _ := runtime.Caller(0) //nolint:dogsled // testing helper
	return filepath.Join(
		filename,
		backDir, backDir, backDir, backDir, backDir,
		"cmd", "migrator", "migrations",
	)
}

func getSchemaMigrationFolder() string {
	_, filename, _, _ := runtime.Caller(0) //nolint:dogsled // testing helper
	return filepath.Join(filename, backDir, "migrations")
}

func getMigrationsOptions(schema SchemaName, schemaMigrationFolderPath, migrationFolderPath string) []postgres.Option {
	opts := []postgres.Option{}

	// 1. Run common-pre-migration scripts first (for extensions like uuid-ossp)
	preMigrationPath := filepath.Join(migrationFolderPath, "common-pre-migration", "*.sql")
	preMatches, _ := filepath.Glob(preMigrationPath)
	sort.Sort(sort.Reverse(sort.StringSlice(preMatches)))
	for _, m := range preMatches {
		opts = append(opts, postgres.WithQueriesFile(m))
	}

	// 2. Apply schema file to create the schema
	opts = append(opts, postgres.WithQueriesFile(path.Join(schemaMigrationFolderPath, fmt.Sprintf("%s.sql", schema.String()))))

	// 3. Run main migration files
	pattern := filepath.Join(migrationFolderPath, "*.up.sql")
	matches, _ := filepath.Glob(pattern)
	sort.Sort(sort.Reverse(sort.StringSlice(matches)))
	for _, m := range matches {
		opts = append(opts, postgres.WithQueriesFile(m))
	}

	// 4. Run common-post-migration scripts last
	postMigrationPath := filepath.Join(migrationFolderPath, "common-post-migration", "*.sql")
	postMatches, _ := filepath.Glob(postMigrationPath)
	sort.Sort(sort.Reverse(sort.StringSlice(postMatches)))
	for _, m := range postMatches {
		opts = append(opts, postgres.WithQueriesFile(m))
	}

	return opts
}

func helperCreatePGSQLContainer(schema SchemaName, m monitoring.Monitor, opts ...testDBConfigOptions) *testDB {
	cfg := &testDBConfig{}
	for _, opt := range append(testDBConfigDefaultOptions(), opts...) {
		opt(cfg)
	}

	// Add critical extension setup directly as first option
	extensionSetup := `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

	options := []postgres.Option{
		postgres.WithQueries(extensionSetup), // This runs first, before any migrations
		postgres.WithUser(testDBUser, testDBPassword),
		postgres.WithDatabase(testDBName),
		postgres.WithTimezone(time.UTC.String()),
		postgres.WithVersion("14.6-alpine"),
	}
	p := postgres.Preset(append(options, getMigrationsOptions(schema, cfg.schemaMigrationFolderPath, cfg.migrationFolderPath)...)...)
	container, err := gnomock.Start(p)
	if err != nil {
		panic(fmt.Sprintf("Unable to start gnomock container, reason: %s", err.Error()))
	}
	connURL, _ := url.Parse(
		fmt.Sprintf(
			"postgres://%s:%s@%s:%d/%s?search_path=%s",
			testDBUser,
			testDBPassword,
			container.Host,
			container.DefaultPort(),
			testDBName,
			fmt.Sprintf("%s,%s", schema.String(), "public"),
		),
	)
	gormClient, err := gormpg.NewClient(connURL, m)
	if err != nil {
		panic("Unable to create gormcli client")
	}

	return &testDB{
		DBClient: gormClient,
		Host:     container.Host,
		Port:     container.DefaultPort(),
		Schema:   schema.String(),
		DBName:   testDBName,
		User:     testDBUser,
		Password: testDBPassword,
	}
}

type TestEntity struct{}
