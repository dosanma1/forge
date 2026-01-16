package gormdb

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/schema"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/persistence/sqldb"
)

const (
	maxOpenConns = 100
	maxIdleConns = 10
)

type config struct {
	gConfig           *gorm.Config
	connectionOptions []sqldb.ConnectionOption
	monitorOpts       []MonitorOption
}

// Option defines the contract for options applied to a gormdb.DBClient.
type Option func(*config) error

// WithDefaultTransaction makes the gormdb.DBClient use
// a default transaction every create/update/delete, defaults to true
func WithDefaultTransaction(enabled bool) Option {
	return func(c *config) error {
		c.gConfig.SkipDefaultTransaction = !enabled
		return nil
	}
}

func withNestedTransactions(enabled bool) Option {
	return func(c *config) error {
		c.gConfig.DisableNestedTransaction = !enabled
		return nil
	}
}

// withNowFunc makes the gormdb.DBClient use
// the provided function when generating a new time (create/update ops).
func withNowFunc(f func() time.Time) Option {
	return func(c *config) error {
		c.gConfig.NowFunc = f
		return nil
	}
}

// WithSingularTable makes the gormdb.DBClient to create tables
// using singular naming convention.
func WithSingularTable(enabled bool) Option {
	return func(c *config) error {
		c.gConfig.NamingStrategy = schema.NamingStrategy{SingularTable: enabled}

		return nil
	}
}

func WithMonitorOpts(options ...MonitorOption) Option {
	return func(c *config) error {
		c.monitorOpts = append(c.monitorOpts, options...)

		return nil
	}
}

// WithSQLConnectionOptions applies the given set of sqldb.ConnectionOption
// when initialising the client.
func WithSQLConnectionOptions(options ...sqldb.ConnectionOption) Option {
	return func(c *config) error {
		c.connectionOptions = append(c.connectionOptions, options...)

		return nil
	}
}

func newConfig(options ...Option) (*config, error) {
	c := &config{
		gConfig:           new(gorm.Config),
		connectionOptions: []sqldb.ConnectionOption{},
	}
	for _, opt := range options {
		err := opt(c)
		if err != nil {
			return nil, err
		}
	}

	return c, nil
}

// DBClient implements a sqldb.Client using gorm.
type DBClient struct {
	*gorm.DB
}

// Database allows to retrieve the sql.DB database handle.
func (cli *DBClient) Database() (*sql.DB, error) {
	dbConn, err := cli.DB.DB()
	if err != nil {
		return nil, err
	}

	return dbConn, nil
}

// PingContext pings the database with the given context (helpful for healthchecking purposes).
func (cli *DBClient) PingContext(ctx context.Context) error {
	conn, err := cli.Database()
	if err != nil {
		return err
	}

	return conn.PingContext(ctx)
}

// Ping pings the database (helpful for healthchecking purposes).
func (cli *DBClient) Ping() error {
	return cli.PingContext(context.Background())
}

// Close closes to connections with the database.
func (cli *DBClient) Close() error {
	conn, err := cli.Database()
	if err != nil {
		return err
	}

	return conn.Close()
}

func (cli *DBClient) WithContext(ctx context.Context) *gorm.DB {
	// try to extract transaction from context, if can't return inner gorm DB
	tx := extractTx(ctx)
	if tx == nil {
		tx = cli.DB
	}
	return tx.Session(&gorm.Session{Context: ctx})
}

func defaultOptions() []Option {
	return []Option{
		WithSingularTable(true),
		WithSQLConnectionOptions(
			[]sqldb.ConnectionOption{
				sqldb.WithDBSchemaFromEnv(),
				sqldb.WithMaxOpenLimit(maxOpenConns),
				sqldb.WithMaxIdleConns(maxIdleConns),
			}...,
		),
		WithDefaultTransaction(false),
		withNestedTransactions(false),
		withNowFunc(func() time.Time {
			return time.Now().UTC().Truncate(time.Microsecond)
		}), // use utc time when generating a new time, truncate to ms as postgres doesn't save ns
	}
}

// Must ensures a DBClient is returned only when there is no error, else it panics.
func Must(cli *DBClient, err error) *DBClient {
	if err != nil {
		panic(err)
	}

	return cli
}

func getDBSchema(db *gorm.DB) string {
	type SchemaResult struct {
		CurrentSchema string `gorm:"column:current_schema"`
	}

	schemaRes := &SchemaResult{}
	err := db.Raw("SELECT current_schema").Scan(schemaRes).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ""
		}
		panic(err)
	}

	return schemaRes.CurrentSchema
}

// New instantiates a new sqldb.Client using a gorm client to connect to a database
// of the given type (list of available dialectors: https://gorm.io/docs/write_driver.html).
//
// This instantiation method can provide a set of Option that can be provided
// to define extra behaviour on client initialization/interaction.
//
// The list of default applied options applied by gormdb.New
// (but can be overiden ):
//
// - WithSingularTable(true): singular naming convention for tables
//
// - WithSQLConnectionOptions(WithDBSchemaFromEnv, WithMaxOpenLimit(100), WithMaxIdleConns(10)):
// which on client initialization links the SEARCH_PATH (DB_SCHEMA envvar is set) to the schema
// and establishes a maximum of 100 connections for the pool, and a max of 10 idle conns.
//
// - WithMonitorOpts:
//   - SlowQueriesThreshold(300ms): defines the boundary of what is considered as a slow query
//
// (those queries will be logged as warnings) to 300 ms.
func New(dialector gorm.Dialector, m monitoring.Monitor, options ...Option) (*DBClient, error) {
	config, err := newConfig(
		append(defaultOptions(), options...)...,
	)
	if err != nil {
		return nil, err
	}

	config.gConfig.Logger = newMonitor(m,
		config.monitorOpts...,
	)
	db, err := gorm.Open(
		dialector,
		config.gConfig,
	)
	if err != nil {
		return nil, err
	}
	cli := &DBClient{DB: db}
	if len(config.connectionOptions) > 0 {
		conn, err := cli.Database()
		if err != nil {
			return nil, err
		}
		for _, opt := range config.connectionOptions {
			err := opt(conn)
			if err != nil {
				return nil, err
			}
		}
	}

	return cli, nil
}
