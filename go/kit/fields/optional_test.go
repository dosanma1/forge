package fields_test

import (
	"encoding/json"
	"log"
	"testing"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type test struct {
	Relationship fields.Optional[*resource.RelationshipDTO] `json:"relationship,omitempty"`
}

func TestOptional(t *testing.T) {
	t.Run("Unmarshal JSON with a non existent value", func(t *testing.T) {
		structToEncode := test{}

		data, err := json.Marshal(structToEncode)
		require.NoError(t, err)

		log.Println(string(data))

		var structToDecode test
		err = json.Unmarshal(data, &structToDecode)
		require.NoError(t, err)
		assert.False(t, structToDecode.Relationship.IsDefined())
	})

	t.Run("Unmarshal JSON with a null value", func(t *testing.T) {
		rel := fields.Optional[*resource.RelationshipDTO]{}
		rel.SetValue(nil)
		structToEncode := test{
			Relationship: rel,
		}

		data, err := json.Marshal(structToEncode)
		require.NoError(t, err)

		log.Println(string(data))

		var structToDecode test
		err = json.Unmarshal(data, &structToDecode)
		require.NoError(t, err)
		assert.True(t, structToDecode.Relationship.IsDefined())
	})
}
