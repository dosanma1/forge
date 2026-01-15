package pg_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
)

type testResource struct {
	pg.Model
	Name string `gorm:"column:name"`
}

func TestDestroyerDestroy(t *testing.T) {
	db := pgtest.GetDB(t, pgtest.TestSchema)
	r, err := pg.NewRepo(db.DBClient, map[fields.Name]string{})
	assert.NoError(t, err)
	des := pg.NewDestroyer[testResource](*r)

	res := testResource{Name: "test"}
	db.Create(&res)

	err = des.Destroy(context.TODO(), search.WithQueryOpts(query.FilterBy(filter.OpEq, fields.NameID, res.ID_)))
	assert.NoError(t, err)

	var got testResource
	err = db.Where("id = ?", res.ID()).First(&got).Error
	assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
}
