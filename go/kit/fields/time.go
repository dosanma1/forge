package fields

import "time"

const (
	NameReceivedAt Name = "received-at"
	NameSentAt     Name = "sent-at"
)

type SentAtTimeInformer interface {
	SentAt() *time.Time
}

type ReceivedAtTimeInformer interface {
	ReceivedAt() *time.Time
}

type ReadAtTimeInformer interface {
	ReadAt() *time.Time
}

type VerifiedAtTimeInformer interface {
	VerifiedAt() *time.Time
}

type ValidFromTimeInformer interface {
	ValidFrom() time.Time
}

type ValidThroughTimeInformer interface {
	ValidThrough() time.Time
}

type RequestedAtTimeInformer interface {
	RequestedAt() *time.Time
}

type ValidSinceTimeInformer interface {
	ValidSince() time.Time
}

type ValidUpToTimeInformer interface {
	ValidUpTo() time.Time
}

type NullableValidUpToTimeInformer interface {
	ValidUpTo() *time.Time
}
