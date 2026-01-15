package grpc_test

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/transport/grpc"
	"github.com/dosanma1/forge/go/kit/transport/grpc/pb"
	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/types/known/anypb"
)

func TestAnyToProto(t *testing.T) {
	want := &pb.Test{
		Name: "test",
	}

	anyTest, err := anypb.New(want)
	assert.NoError(t, err)

	got, err := grpc.AnyToProto[*pb.Test](anyTest)
	assert.NoError(t, err)
	assert.Equal(t, want.Name, got.Name)
}
