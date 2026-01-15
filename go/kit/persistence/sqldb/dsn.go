package sqldb

import (
	"net"
	"net/url"
	"os"
	"strings"
)

type connField string

func (f connField) String() string {
	return string(f)
}

func (f connField) valid() bool {
	return f == connFieldHost || f == connFieldPort ||
		f == connFieldUser || f == connFieldPwd ||
		f == connFieldDBName || f == connFieldSSLMode
}

const (
	connFieldHost    connField = "host"
	connFieldPort    connField = "port"
	connFieldUser    connField = "user"
	connFieldPwd     connField = "password"
	connFieldDBName  connField = "dbname"
	connFieldSSLMode connField = "sslmode"
)

//nolint:gochecknoglobals // we want this global variable to have all the connection fields in place
var orderedConnFields = []connField{
	connFieldHost, connFieldPort, connFieldDBName,
	connFieldUser, connFieldPwd, connFieldSSLMode,
}

type dsn map[connField]string

func (d dsn) add(f connField, val string) error {
	if !f.valid() {
		return nil
	}
	d[f] = strings.TrimSpace(val)

	return nil
}

func (d dsn) buildQueryParams() url.Values {
	vals := url.Values{}
	vals.Add(connFieldSSLMode.String(), d[connFieldSSLMode])

	return vals
}

func (d dsn) validateConnFields() error {
	for _, f := range orderedConnFields {
		if len(d[f]) < 1 {
			return newErrEmptyDSNField(f)
		}
	}

	return nil
}

func (d dsn) genConnectionURL(driverType DriverType) (*url.URL, error) {
	if err := d.validateConnFields(); err != nil {
		return nil, err
	}

	return &url.URL{
		Scheme:   string(driverType),
		User:     url.UserPassword(d[connFieldUser], d[connFieldPwd]),
		Path:     d[connFieldDBName],
		Host:     net.JoinHostPort(d[connFieldHost], d[connFieldPort]),
		RawQuery: d.buildQueryParams().Encode(),
	}, nil
}

// ConnectionDSNOption defines the contract for the options being applied to the DSN.
type ConnectionDSNOption func(dsn) error

func withConnStringVal(field connField, val string) ConnectionDSNOption {
	return func(connDSN dsn) error {
		return connDSN.add(field, val)
	}
}

// WithConnHost sets the given db host in the DSN.
func WithConnHost(host string) ConnectionDSNOption {
	return withConnStringVal(connFieldHost, host)
}

// WithConnPort sets the given db port in the DSN.
func WithConnPort(port string) ConnectionDSNOption {
	return withConnStringVal(connFieldPort, port)
}

// WithConnUser sets the given user in the DSN.
func WithConnUser(user string) ConnectionDSNOption {
	return withConnStringVal(connFieldUser, user)
}

// WithConnPwd sets the given password in the DSN.
func WithConnPwd(pwd string) ConnectionDSNOption {
	return withConnStringVal(connFieldPwd, pwd)
}

// WithConnDBName sets the given database name in the DSN.
func WithConnDBName(dbName string) ConnectionDSNOption {
	return withConnStringVal(connFieldDBName, dbName)
}

// WithConnSSLMode sets the given ssl mode in the DSN.
func WithConnSSLMode(sslMode string) ConnectionDSNOption {
	return withConnStringVal(connFieldSSLMode, sslMode)
}

// WithDSNConnFromEnv applies all the parameters of the DSN url from env.
// (this is the default option applied when calling sqldb.NewDSN).
//
// - envvars being read: DB_NAME, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_SSL.
func WithDSNConnFromEnv() ConnectionDSNOption {
	return func(dsn dsn) error {
		options := []ConnectionDSNOption{
			WithConnHost(os.Getenv("DB_HOST")),
			WithConnPort(os.Getenv("DB_PORT")),
			WithConnDBName(os.Getenv("DB_NAME")),
			WithConnUser(os.Getenv("DB_USER")),
			WithConnPwd(os.Getenv("DB_PASSWORD")),
			WithConnSSLMode(os.Getenv("DB_SSL")),
		}

		for _, opt := range options {
			err := opt(dsn)
			if err != nil {
				return err
			}
		}

		return nil
	}
}

func defaultDSNOptions() []ConnectionDSNOption {
	return []ConnectionDSNOption{
		WithDSNConnFromEnv(),
	}
}

// NewDSN generates the url of a DSN (data source name) to connect to a specific database.
// This url is being generated from the database name, authentication (username, password),
// host, port and ssl mode.
//
// By default it takes the params from the following envvars, though any of the params
// can be overiden using specific options.
//
// Envvars read by default: DB_NAME, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_SSL.
func NewDSN(driverType DriverType, options ...ConnectionDSNOption) (*url.URL, error) {
	if !driverType.valid() {
		return nil, newErrConnInvalidDriver(driverType)
	}

	connDSN := dsn(map[connField]string{
		connFieldHost: "", connFieldPort: "",
		connFieldDBName: "", connFieldUser: "",
		connFieldPwd: "", connFieldSSLMode: "",
	})
	for _, opt := range append(defaultDSNOptions(), options...) {
		err := opt(connDSN)
		if err != nil {
			return nil, err
		}
	}

	return connDSN.genConnectionURL(driverType)
}

// MustGenerateDSN generates a dsn or panics in case of failure.
func MustGenerateDSN(driverType DriverType, options ...ConnectionDSNOption) *url.URL {
	dsn, err := NewDSN(driverType, options...)
	if err != nil {
		panic(err)
	}

	return dsn
}
