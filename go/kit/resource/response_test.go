package resource_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
)

func TestNewListResponse(t *testing.T) {
	res := resourcetest.NewStub()

	inColl := []resource.Resource{res, res}
	inCount := 52

	input := resource.NewListResponse(inColl, inCount)
	assert.Equal(t, input.Results(), inColl)
	assert.Equal(t, input.TotalCount(), inCount)
}
