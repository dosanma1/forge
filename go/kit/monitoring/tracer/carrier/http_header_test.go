package carrier_test

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

func TestHttpHeaderTextMapCarrier(t *testing.T) {
	header := http.Header{}
	c := carrier.NewHTTPHeaderTextMapCarrier(header)
	c.Set("test1", "1")
	c.Set("test2", "2")
	c.Set("test1", "3")

	assert.Equal(t, "2", c.Get("test2"))
	assert.Equal(t, "3", c.Get("test1"))
	assert.Contains(t, c.Keys(), "Test1")
	assert.Contains(t, c.Keys(), "Test2")

	assert.Equal(t, "2", header.Get("test2"))
	assert.Equal(t, "3", header.Get("test1"))
}
