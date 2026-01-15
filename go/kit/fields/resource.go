package fields

import "time"

const (
	NameID           Name = "id"
	NameLID          Name = "lid"
	NameOID          Name = "oid"
	NameTime         Name = "time"
	NameTimestamp    Name = "timestamp"
	NameDate         Name = "date"
	NameTimestamps   Name = "timestamps"
	NameCreationTime Name = "createdAt"
	NameUpdatedTime  Name = "updatedAt"
	NameDeletionTime Name = "deletedAt"
	NameDuration     Name = "duration"
)

type Identifier interface {
	ID() string
	LID() string
}

type CreationTimeInformer interface {
	CreatedAt() time.Time
}

type UpdatedTimeInformer interface {
	UpdatedAt() time.Time
}

type DeletionTimeInformer interface {
	DeletedAt() *time.Time
}
