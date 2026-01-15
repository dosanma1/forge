package grpc

import (
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"
)

func TimePointerToTimestamp(t *time.Time) *timestamppb.Timestamp {
	if t == nil || t.IsZero() {
		return nil
	}
	return timestamppb.New(*t)
}

func TimestampToTimePointer(t *timestamppb.Timestamp) *time.Time {
	if t == nil || !t.IsValid() {
		return nil
	}

	out := t.AsTime()
	if out.IsZero() {
		return nil
	}
	return &out
}
