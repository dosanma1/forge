package postgres

import (
	"context"
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/gormdb/gormdbtest"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestEntity is a simple model for testing repository logic
type TestEntity struct {
	EID        string    `gorm:"primaryKey;column:id"`
	EName      string    `gorm:"column:name"`
	EAge       int       `gorm:"column:age"`
	ECreatedAt time.Time `gorm:"column:created_at"`
}

func (TestEntity) TableName() string {
	return "test_entities"
}

func TestRepoFilterApplyIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	// Spin up test DB container
	testDB := gormdbtest.GetDB(t, gormdbtest.TestSchema)
	require.NotNil(t, testDB)

	// Create table for test entity manually since we don't have migrations for it
	err := testDB.DB.AutoMigrate(&TestEntity{})
	require.NoError(t, err)

	// Seed data
	now := time.Now().UTC().Truncate(time.Microsecond)
	seedData := []TestEntity{
		{EID: "1", EName: "Alice", EAge: 30, ECreatedAt: now},
		{EID: "2", EName: "Bob", EAge: 20, ECreatedAt: now.Add(-1 * time.Hour)},
		{EID: "3", EName: "Charlie", EAge: 25, ECreatedAt: now.Add(-2 * time.Hour)},
	}
	require.NoError(t, testDB.DB.Create(&seedData).Error)

	// Init Repo
	repo, err := NewRepo(
		testDB.DBClient,
		map[string]string{
			"id":         "id",
			"name":       "name",
			"age":        "age",
			"created_at": "created_at",
		},
	)
	require.NoError(t, err)

	ctx := context.Background()

	t.Run("OpEq", func(t *testing.T) {
		q := query.New()
		query.AddFilter(q, filter.OpEq, "name", "Alice")

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 1)
		assert.Equal(t, "Alice", results[0].EName)
	})

	t.Run("OpGT", func(t *testing.T) {
		q := query.New()
		query.AddFilter(q, filter.OpGT, "age", 22)

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Order("age ASC").Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 2) // Charlie (25), Alice (30)
		assert.Equal(t, "Charlie", results[0].EName)
		assert.Equal(t, "Alice", results[1].EName)
	})

	t.Run("OpBetween", func(t *testing.T) {
		q := query.New()
		query.AddFilter(q, filter.OpBetween, "age", []any{20, 28})

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Order("age ASC").Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 2) // Bob (20), Charlie (25)
		assert.Equal(t, "Bob", results[0].EName)
		assert.Equal(t, "Charlie", results[1].EName)
	})

	t.Run("OpIn", func(t *testing.T) {
		q := query.New()
		query.AddFilter(q, filter.OpIn, "name", []string{"Alice", "Bob"})

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Order("name ASC").Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 2)
		assert.Equal(t, "Alice", results[0].EName)
		assert.Equal(t, "Bob", results[1].EName)
	})

	t.Run("Sorting", func(t *testing.T) {
		q := query.New()
		q.Sorting().Set("age", query.SortDesc)

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Find(&results).Error
		require.NoError(t, err)
		assert.Equal(t, "Alice", results[0].EName)   // 30
		assert.Equal(t, "Charlie", results[1].EName) // 25
		assert.Equal(t, "Bob", results[2].EName)     // 20
	})

	t.Run("Pagination", func(t *testing.T) {
		q := query.New(query.Pagination(1, 0))
		q.Sorting().Set("age", query.SortAsc)

		var results []TestEntity
		err := repo.QueryApply(ctx, q).Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 1)
		assert.Equal(t, "Bob", results[0].EName)

		q2 := query.New(query.Pagination(1, 1))
		q2.Sorting().Set("age", query.SortAsc)
		err = repo.QueryApply(ctx, q2).Find(&results).Error
		require.NoError(t, err)
		assert.Len(t, results, 1)
		assert.Equal(t, "Charlie", results[0].EName)
	})
}
