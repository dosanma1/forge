// Package pgtest Repository test helpers
package pgtest

import (
	"database/sql"
	"database/sql/driver"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/persistence/gormcli/mock"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/resource"
)

type DBTest struct {
	*mock.Cli
}

func NewTest(t *testing.T, opts ...mock.SetupOpt) *DBTest {
	t.Helper()

	m := mock.GormCli(t, opts...)

	return &DBTest{Cli: m}
}

func assertEqualTimestamps(
	t *testing.T,
	createdAt, updatedAt time.Time, deletedAt *time.Time,
	timestamps pg.Timestamps,
) {
	t.Helper()

	assert.Equal(t, createdAt, timestamps.CreatedAt())
	assert.Equal(t, updatedAt, timestamps.UpdatedAt())
	assert.Equal(t, deletedAt, timestamps.DeletedAt())
}

func AssertEqualTimestampsFromResource(
	t *testing.T,
	r resource.Resource,
	timestamps pg.Timestamps,
) {
	t.Helper()

	assertEqualTimestamps(t,
		r.CreatedAt(), r.UpdatedAt(), r.DeletedAt(),
		timestamps,
	)
}

func RunValuerPGFormattedTest(
	t *testing.T,
	valuerGen func(t time.Time) driver.Valuer,
) {
	t.Helper()

	in := time.Now().Local()
	expected := in.UTC().Truncate(time.Microsecond)

	dVal, err := valuerGen(in).Value()

	assert.NoError(t, err)
	assert.Equal(t, expected, dVal)
}

func RunScannerPGFormattedTest(
	t *testing.T,
	scannerGen func() sql.Scanner, timeAfterScan func() time.Time,
) {
	t.Helper()

	in := time.Now().Local()
	expected := in.UTC().Truncate(time.Microsecond)

	scanner := scannerGen()
	err := scanner.Scan(in)

	assert.NoError(t, err)
	assert.Equal(t, expected, timeAfterScan())
}
