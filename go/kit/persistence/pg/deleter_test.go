package pg_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

func Test_deleter_Delete_QueryValidation(t *testing.T) {
	db := pgtest.GetDB(t, pgtest.TestSchema)
	r, err := pg.NewRepo(db.DBClient, map[fields.Name]string{})
	assert.NoError(t, err)
	repo := pg.NewDeleter[testResource](r, func(q query.Query) error { return assert.AnError })

	err = repo.Delete(context.Background(), repository.DeleteTypeHard, search.WithQueryOpts(
		query.FilterBy(filter.OpEq, fields.NameID, uuid.NewString()),
	))
	assert.ErrorIs(t, err, assert.AnError)
}

func Test_deleter_Delete(t *testing.T) {
	db := pgtest.GetDB(t, pgtest.TestSchema)
	r, err := pg.NewRepo(db.DBClient, map[fields.Name]string{})
	assert.NoError(t, err)
	repo := pg.NewDeleter[testResource](r, func(q query.Query) error { return nil })
	res := testResource{Name: "test"}

	tests := []struct {
		name      string
		delType   repository.DeleteType
		createRes func(t *testing.T) *testResource
		wantErr   error
	}{
		{
			name:    "delete resource that does not exist, should return nil",
			delType: repository.DeleteTypeHard,
			createRes: func(t *testing.T) *testResource {
				t.Helper()
				res.ID_ = uuid.NewString()
				err := db.Create(&res).Error
				require.NoError(t, err)
				return &res
			},
		},
		{
			name:    "soft delete resource that exists, should return nil",
			delType: repository.DeleteTypeSoft,
			createRes: func(t *testing.T) *testResource {
				t.Helper()
				res.ID_ = uuid.NewString()
				err := db.Create(&res).Error
				require.NoError(t, err)
				return &res
			},
		},
		{
			name:    "hard delete resource that exists, should return nil",
			delType: repository.DeleteTypeHard,
			createRes: func(t *testing.T) *testResource {
				t.Helper()
				res.ID_ = uuid.NewString()
				err := db.Create(&res).Error
				require.NoError(t, err)
				return &res
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			created := tt.createRes(t)
			err := repo.Delete(context.Background(), tt.delType, search.WithQueryOpts(
				query.FilterBy(filter.OpEq, fields.NameID, created.ID()),
			))
			assert.ErrorIs(t, err, tt.wantErr)

			if err == nil {
				var got testResource
				err = db.DB.Unscoped().Where("id = ?", created.ID()).First(&got).Error
				if tt.delType == repository.DeleteTypeSoft {
					assert.NoError(t, err)
					assert.NotNil(t, got.DeletedAt())
				} else {
					assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
				}
			}
		})
	}
}
