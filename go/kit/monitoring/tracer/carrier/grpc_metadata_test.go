package carrier_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

func TestGrpcMetadataTextMapCarrier(t *testing.T) {
	md := metadata.MD{}
	c := carrier.NewGRPCMetadataTextMapCarrier(md)
	c.Set("test1", "1")
	c.Set("test2", "2")
	c.Set("test1", "3")

	assert.Equal(t, "2", c.Get("test2"))
	assert.Equal(t, "3", c.Get("test1"))
	assert.Contains(t, c.Keys(), "test1")
	assert.Contains(t, c.Keys(), "test2")

	assert.Equal(t, "2", md.Get("test2")[0])
	assert.Equal(t, "3", md.Get("test1")[0])
}
