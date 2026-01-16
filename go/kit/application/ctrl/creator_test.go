package ctrl_test

import (
	"context"
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/usecase/usecasetest"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
	"github.com/stretchr/testify/assert"
)

func TestCreate(t *testing.T) {
	t.Parallel()

	uc := usecasetest.NewCreator[resource.Resource](t)
	controller := ctrl.NewCreator[resource.Resource](uc)
	res := resource.New(
		resource.WithID("id"),
		resource.WithType("kind"),
		resource.WithCreatedAt(time.Now()),
		resource.WithUpdatedAt(time.Now()),
	)

	t.Run("if usecase fails, return error", func(t *testing.T) {
		uc.EXPECT().Create(context.TODO(), res).Return(resource.New(resource.WithType(resourcetest.ResourceTypeStub)), assert.AnError).Once()
		_, err := controller.Create(context.TODO(), res)
		assert.ErrorIs(t, err, assert.AnError)
	})

	t.Run("if usecase returns resource, return it", func(t *testing.T) {
		uc.EXPECT().Create(context.TODO(), res).Return(res, nil).Once()
		got, err := controller.Create(context.TODO(), res)
		assert.NoError(t, err)
		resourcetest.AssertEqual(t, res, got)
	})
}

func TestCreateBatch(t *testing.T) {
	t.Parallel()

	uc := usecasetest.NewCreatorBatch[resource.Resource](t)
	controller := ctrl.NewCreatorBatch[resource.Resource](uc)
	res := []resource.Resource{resource.New(
		resource.WithID("id"),
		resource.WithType("kind"),
		resource.WithCreatedAt(time.Now()),
		resource.WithUpdatedAt(time.Now()),
	)}

	t.Run("if usecase fails, return error", func(t *testing.T) {
		uc.EXPECT().CreateBatch(context.TODO(), res).Return([]resource.Resource{resource.New(resource.WithType(resourcetest.ResourceTypeStub))}, assert.AnError).Once()
		_, err := controller.CreateBatch(context.TODO(), res)
		assert.ErrorIs(t, err, assert.AnError)
	})

	t.Run("if usecase returns resource, return it", func(t *testing.T) {
		uc.EXPECT().CreateBatch(context.TODO(), res).Return(res, nil).Once()
		got, err := controller.CreateBatch(context.TODO(), res)
		assert.NoError(t, err)
		for i, r := range res {
			resourcetest.AssertEqual(t, r, got[i])
		}
	})
}
