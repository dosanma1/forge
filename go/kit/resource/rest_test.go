package resource_test

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
)

func TestToRestDTO(t *testing.T) {
	t.Parallel()

	cTime := time.Now().UTC()
	deletedAt := cTime.Add(2 * time.Second)
	stub := resourcetest.NewStub(
		resourcetest.WithID("stub-id"),
		resourcetest.WithCreatedAt(cTime),
		resourcetest.WithUpdatedAt(cTime),
		resourcetest.WithDeletedAt(&deletedAt),
		resourcetest.WithType("stubs"),
	)
	dto := resource.ToRestDTO(stub)

	resourcetest.AssertEqual(t, stub, &dto)

	tJSON, err := json.Marshal(&cTime)
	assert.NoError(t, err)
	dtJSON, err := json.Marshal(&deletedAt)
	assert.NoError(t, err)
	bs, err := json.Marshal(dto)
	want := fmt.Sprintf(
		`{"RID":"stub-id","RLID":"","RType":"stubs","RTimestamps":{"RCreatedAt":%s,"RUpdatedAt":%s,"RDeletedAt":%s}}`,
		string(tJSON), string(tJSON), string(dtJSON),
	)

	assert.NoError(t, err)
	assert.Equal(t, want, string(bs))
}

func TestRelationshipToDTO(t *testing.T) {
	t.Parallel()

	resID := "12345"
	resType := resource.Type("examples")

	tests := []struct {
		name string
		opts []resource.RelationshipDTOOpt
		want resource.Identifier
	}{
		{
			"empty opts", nil, nil,
		},
		{
			"empty identifier", []resource.RelationshipDTOOpt{resource.RelFromIdentifier(nil)}, nil,
		},
		{
			"empty kind", []resource.RelationshipDTOOpt{resource.RelFromIDAndType("1234", "")}, nil,
		},
		{
			"valid",
			[]resource.RelationshipDTOOpt{
				resource.RelFromIdentifier(resourcetest.NewStub(
					resourcetest.WithID(resID),
					resourcetest.WithType(resource.Type(resType)),
				)),
			},
			&resource.RelationshipDTO{
				RestDTO: resource.RestDTO{RID: resID, RType: resType},
			},
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got := resource.RelationshipToDTO(test.opts...)
			resourcetest.AssertEqualIdentifier(t, test.want, got)
		})
	}
}
