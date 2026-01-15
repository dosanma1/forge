package carrier_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

func TestMapStringAnyCarrier(t *testing.T) {
	m := make(map[string]any)
	c := carrier.NewMapStringAnyCarrier(m)
	c.Set("test1", "1")
	c.Set("test2", "2")
	c.Set("test1", "3")

	assert.Equal(t, "2", c.Get("test2"))
	assert.Equal(t, "3", c.Get("test1"))
	assert.Contains(t, c.Keys(), "test1")
	assert.Contains(t, c.Keys(), "test2")

	assert.Equal(t, "2", m["test2"])
	assert.Equal(t, "3", m["test1"])
}
