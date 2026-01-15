package gormcli_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/pg"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

type testResource struct {
	pg.Model
	Name string `gorm:"column:name"`
}

func TestDeleterDelete(t *testing.T) {
	db := pgtest.GetDB(t, pgtest.TestSchema)
	des := gormcli.NewDeleter[testResource](db.DBClient)

	res := testResource{Name: "test"}
	db.Create(&res)

	err := des.Delete(context.TODO(), res.ID_)
	assert.NoError(t, err)

	var got testResource
	err = db.Where("id = ?", res.ID_).First(&got).Error
	assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
}

func TestDeleterUndelete(t *testing.T) {
	db := pgtest.GetDB(t, pgtest.TestSchema)
	des := gormcli.NewDeleter[testResource](db.DBClient)

	res := testResource{Name: "test"}
	db.Create(&res)

	err := des.Delete(context.TODO(), res.ID_)
	assert.NoError(t, err)

	err = des.Undelete(context.TODO(), res.ID_)
	assert.NoError(t, err)

	var got testResource
	err = db.Where("id = ?", res.ID_).First(&got).Error
	assert.NoError(t, err)
	assert.Equal(t, res.ID(), got.ID())
	assert.Equal(t, res.CreatedAt(), got.CreatedAt())
	assert.Greater(t, got.UpdatedAt().UnixNano(), res.UpdatedAt().UnixNano())
	assert.Nil(t, got.DeletedAt())
	assert.Equal(t, res.Name, got.Name)
}
