package resource_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/kslices"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
)

func TestIDMapper(t *testing.T) {
	resources := []resource.Resource{resourcetest.NewStub(), resourcetest.NewStub()}
	ids := kslices.Map(resources, resource.IDMapper[resource.Resource]())
	assert.Len(t, ids, len(resources))
	for i, id := range ids {
		assert.Equal(t, resources[i].ID(), id)
	}
}
