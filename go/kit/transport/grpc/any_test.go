package grpc_test

import (
	"testing"

	transportgrpc "github.com/dosanma1/forge/go/kit/transport/grpc"
	grpctestpb "github.com/dosanma1/forge/go/kit/transport/grpc/grpctest/grpctestpb"
	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/types/known/anypb"
)

func TestAnyToProto(t *testing.T) {
	want := &grpctestpb.Test{
		Name: "test",
	}

	anyTest, err := anypb.New(want)
	assert.NoError(t, err)

	got, err := transportgrpc.AnyToProto[*grpctestpb.Test](anyTest)
	assert.NoError(t, err)
	assert.Equal(t, want.Name, got.Name)
}
