package pg_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/search/query"
)

const selectQuery = `SELECT * FROM "test_entity" `

func TestFilterApply(t *testing.T) {
	testCases := map[string]struct {
		query query.Query
		want  string
	}{
		"IN 1 value": {
			query: query.New(query.FilterBy(filter.OpIn, fields.NameID, []string{"id"})),
			want:  "WHERE id IN ('id')",
		},
		"IN several values": {
			query: query.New(query.FilterBy(filter.OpIn, fields.NameID, []string{"id1", "id2", "id3"})),
			want:  "WHERE id IN ('id1','id2','id3')",
		},
		"LIKE ANY 1 value": {
			query: query.New(query.FilterBy(filter.OpContainsLike, fields.NameID, []string{"id"})),
			want:  "WHERE EXISTS(SELECT FROM unnest(id) cl_alias WHERE cl_alias LIKE ANY(ARRAY['%%%%' || 'id' || '%%%%']))",
		},
		"LIKE several 1 values": {
			query: query.New(query.FilterBy(filter.OpContainsLike, fields.NameID, []string{"id1", "id2"})),
			want:  "WHERE EXISTS(SELECT FROM unnest(id) cl_alias WHERE cl_alias LIKE ANY(ARRAY['%%%%' || 'id1' || '%%%%','%%%%' || 'id2' || '%%%%']))",
		},
		"BETWEEN time range": {
			query: query.New(
				query.FilterBy(
					filter.OpBetween, fields.NameCreationTime,
					[]time.Time{
						time.Date(2023, time.January, 10, 0, 0, 0, 0, time.UTC),
						time.Date(2023, time.March, 13, 11, 30, 0, 0, time.UTC),
					},
				)),
			want: "WHERE created_at BETWEEN '2023-01-10 00:00:00' AND '2023-03-13 11:30:00'",
		},
		"CONTAINS 1 value": {
			query: query.New(query.FilterBy(filter.OpContains, fields.NameID, "id")),
			want:  "WHERE id @> '{\"id\"}'",
		},
		"CONTAINS 1 array value": {
			query: query.New(query.FilterBy(filter.OpContains, fields.NameID, []string{"id"})),
			want:  "WHERE id @> '{\"id\"}'",
		},
		"CONTAINS several array values": {
			query: query.New(query.FilterBy(filter.OpContains, fields.NameID, []string{"id1", "id2"})),
			want:  "WHERE id @> '{\"id1\",\"id2\"}'",
		},
		"IS NULL": {
			query: query.New(query.FilterBy(filter.OpIs, fields.NameID, nil)),
			want:  "WHERE id IS NULL",
		},
		"IS with value": {
			query: query.New(query.FilterBy(filter.OpIs, fields.NameID, "5")),
			want:  "WHERE id IS '5'",
		},
		"IS NOT NULL": {
			query: query.New(query.FilterBy(filter.OpIsNot, fields.NameID, nil)),
			want:  "WHERE id IS NOT NULL",
		},
		"IS NOT with value": {
			query: query.New(query.FilterBy(filter.OpIsNot, fields.NameID, "5")),
			want:  "WHERE id IS NOT '5'",
		},
		"IS NOT with number": {
			query: query.New(query.FilterBy(filter.OpIsNot, fields.NameID, 5)),
			want:  "WHERE id IS NOT 5",
		},
		"several filters": {
			query: query.New(
				query.FilterBy(filter.OpEq, fields.NameID, "id"),
				query.FilterBy(filter.OpNEq, fields.NameName, []string{"name"}),
			),
			want: "WHERE id = 'id' AND name <> '{\"name\"}'",
		},
	}
	for name, tC := range testCases {
		t.Run(name, func(t *testing.T) {
			client := pgtest.NewTest(t).DBClient
			r, err := pg.NewRepo(client, map[fields.Name]string{
				fields.NameCreationTime: "created_at",
			})
			assert.NoError(t, err)
			got := client.DB.ToSQL(func(tx *gorm.DB) *gorm.DB {
				return r.QueryApply(context.TODO(), tC.query).Session(&gorm.Session{DryRun: true}).Find(&pgtest.TestEntity{})
			})
			if got != selectQuery+tC.want {
				t.Errorf("queries aren't equal\nwant -> '%s'\n got -> '%s'", selectQuery+tC.want, got)
			}
		})
	}
}

func TestRepoQueryApplyWithLock(t *testing.T) {
	ctx := context.Background()

	testCases := map[string]struct {
		query query.Query
		want  string
		ctx   context.Context
	}{
		"IN 1 value without lock": {
			query: query.New(query.FilterBy(filter.OpIn, fields.NameID, []string{"id"})),
			ctx:   ctx,
			want:  "WHERE id IN ('id')",
		},
		"IN 1 value with lock": {
			query: query.New(query.FilterBy(filter.OpIn, fields.NameID, []string{"id"})),
			ctx:   repository.WithLockingCtx(ctx, repository.LockLevelRow, repository.LockModeExclusive),
			want:  "WHERE id IN ('id') FOR UPDATE",
		},
		"CONTAINS 1 value without lock": {
			query: query.New(query.FilterBy(filter.OpContains, fields.NameID, "id")),
			ctx:   ctx,

			want: "WHERE id @> '{\"id\"}'",
		},
		"CONTAINS 1 value with lock": {
			query: query.New(query.FilterBy(filter.OpContains, fields.NameID, "id")),
			ctx:   repository.WithLockingCtx(ctx, repository.LockLevelRow, repository.LockModeExclusive),
			want:  "WHERE id @> '{\"id\"}' FOR UPDATE",
		},
	}
	for name, tC := range testCases {
		t.Run(name, func(t *testing.T) {
			client := pgtest.NewTest(t).DBClient
			r, err := pg.NewRepo(client, map[fields.Name]string{
				fields.NameCreationTime: "created_at",
			})
			assert.NoError(t, err)
			got := client.DB.ToSQL(func(tx *gorm.DB) *gorm.DB {
				return r.QueryApply(tC.ctx, tC.query).Session(&gorm.Session{DryRun: true}).Find(&pgtest.TestEntity{})
			})
			if got != selectQuery+tC.want {
				t.Errorf("queries aren't equal\nwant -> '%s'\n got -> '%s'", selectQuery+tC.want, got)
			}
		})
	}
}
