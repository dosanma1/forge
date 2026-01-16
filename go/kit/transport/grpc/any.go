package grpc

import (
	"errors"

	"github.com/dosanma1/forge/go/kit/instance"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/anypb"
)

var ErrInvalidProtoType = errors.New("message is not valid type")

// AnyToProto unmarshals a protobuf Any message into the specified proto type.
//
// The type parameter P must be a pointer to a proto message (e.g., *pb.User).
//
// Example:
//
//	anyMsg := &anypb.Any{...}
//	user, err := grpc.AnyToProto[*pb.User](anyMsg)
func AnyToProto[P protoreflect.ProtoMessage](a *anypb.Any) (P, error) {
	if a == nil {
		var zero P
		return zero, nil
	}

	p := instance.New[P]()

	if !a.MessageIs(p) {
		var zero P
		return zero, ErrInvalidProtoType
	}

	err := a.UnmarshalTo(p)
	if err != nil {
		var zero P
		return zero, err
	}
	return p, nil
}
