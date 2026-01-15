package resource

import (
	"github.com/dosanma1/forge/go/kit/kslices"
	"github.com/dosanma1/forge/go/kit/resource/pb"
	"github.com/dosanma1/forge/go/kit/transport/grpc"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func ToProto(resource Resource) *pb.Resource {
	if resource == nil {
		return &pb.Resource{}
	}

	return &pb.Resource{
		Id:        resource.ID(),
		CreatedAt: timestamppb.New(resource.CreatedAt()),
		UpdatedAt: timestamppb.New(resource.UpdatedAt()),
		DeletedAt: grpc.TimePointerToTimestamp(resource.DeletedAt()),
		Type:      resource.Type().String(),
	}
}

func FromProto(r *pb.Resource) Resource {
	if r == nil {
		return nil
	}
	return &resource{
		id:        r.GetId(),
		createdAt: r.GetCreatedAt().AsTime(),
		updatedAt: r.GetUpdatedAt().AsTime(),
		deletedAt: grpc.TimestampToTimePointer(r.GetDeletedAt()),
		kind:      Type(r.GetType()),
	}
}

func IdentifiersToProto(rs []Identifier) []*pb.ResourceIdentifier {
	return kslices.Map(rs, IdentifierToProto)
}

func IdentifierToProto(r Identifier) *pb.ResourceIdentifier {
	if r == nil {
		return &pb.ResourceIdentifier{}
	}
	return &pb.ResourceIdentifier{
		Id:   r.ID(),
		Type: r.Type().String(),
	}
}

func IdentifierFromProto(r *pb.ResourceIdentifier) Identifier {
	if r == nil {
		return nil
	}
	return NewIdentifier(r.Id, Type(r.Type))
}
