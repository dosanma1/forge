package grpc

import (
	"errors"

	"github.com/dosanma1/forge/go/kit/generics"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/anypb"
)

var ErrInvalidProtoType = errors.New("message is not valid type")

func AnyToProto[P protoreflect.ProtoMessage](a *anypb.Any) (P, error) {
	if a == nil {
		var zero P
		return zero, nil
	}
	p := generics.New[P]()
	if !a.MessageIs(p) {
		return p, ErrInvalidProtoType
	}

	err := a.UnmarshalTo(p)
	if err != nil {
		var zero P
		return zero, err
	}
	return p, nil
}
