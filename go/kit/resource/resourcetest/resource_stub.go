// Package resourcetest provides test helpers for resource package
package resourcetest

import (
	"math/rand"
	"strconv"
	"time"

	"github.com/google/uuid"

	"github.com/dosanma1/forge/go/kit/resource"
)

const (
	ResourceTypeStub = resource.Type("test")
	Serial4Limit     = 2147483647 - 1
)

type ResourceStub struct {
	id        string
	lid       string
	kind      resource.Type
	createdAt time.Time
	updatedAt time.Time
	deletedAt *time.Time
}

type Option func(*ResourceStub)

func defaultOpts() []Option {
	return []Option{
		WithID(uuid.NewString()),
		WithType(ResourceTypeStub),
		WithCreatedAt(time.Now().UTC()),
		WithUpdatedAt(time.Now().UTC()),
	}
}

func NewStub(opts ...Option) *ResourceStub {
	res := &ResourceStub{}
	for _, opt := range append(defaultOpts(), opts...) {
		opt(res)
	}
	return res
}

func WithID(id string) Option {
	return func(rs *ResourceStub) {
		rs.id = id
	}
}

func WithLID(lid string) Option {
	return func(rs *ResourceStub) {
		rs.lid = lid
	}
}

func WithRandomSerialID() Option {
	return func(rs *ResourceStub) {
		rs.id = RandomSerialID()
	}
}

func WithRandomSerialLID() Option {
	return func(rs *ResourceStub) {
		rs.lid = RandomSerialID()
	}
}

func WithType(kind resource.Type) Option {
	return func(rs *ResourceStub) {
		rs.kind = kind
	}
}

func WithCreatedAt(createdAt time.Time) Option {
	return func(rs *ResourceStub) {
		rs.createdAt = createdAt
	}
}

func WithUpdatedAt(updatedAt time.Time) Option {
	return func(rs *ResourceStub) {
		rs.updatedAt = updatedAt
	}
}

func WithDeletedAt(deletedAt *time.Time) Option {
	return func(rs *ResourceStub) {
		rs.deletedAt = deletedAt
	}
}

func WithEmptyResource() Option {
	return func(rs *ResourceStub) {
		rs.id = ""
		rs.createdAt = time.Time{}
		rs.updatedAt = time.Time{}
		rs.deletedAt = nil
	}
}

func WithRef(id string, kind resource.Type) Option {
	return func(rs *ResourceStub) {
		rs.id = id
		rs.createdAt = time.Time{}
		rs.updatedAt = time.Time{}
		rs.deletedAt = nil
		rs.kind = kind
	}
}

func FromResource(r resource.Resource) Option {
	return func(rs *ResourceStub) {
		rs.id = r.ID()
		rs.kind = resource.Type(r.Type())
		rs.createdAt = r.CreatedAt()
		rs.updatedAt = r.UpdatedAt()
		rs.deletedAt = r.DeletedAt()
	}
}

func WithSerialDefaultOpts() Option {
	return func(rs *ResourceStub) {
		rs.id = RandomSerialID()
		rs.kind = ResourceTypeStub
		rs.createdAt = time.Now().UTC()
		rs.updatedAt = time.Now().UTC()
	}
}

func (rs *ResourceStub) ID() string {
	return rs.id
}

func (rs *ResourceStub) LID() string {
	return rs.lid
}

func (rs *ResourceStub) Type() resource.Type {
	return rs.kind
}

func (rs *ResourceStub) CreatedAt() time.Time {
	return rs.createdAt
}

func (rs *ResourceStub) UpdatedAt() time.Time {
	return rs.updatedAt
}

func (rs *ResourceStub) DeletedAt() *time.Time {
	return rs.deletedAt
}

func (rs *ResourceStub) Updates(opts ...Option) *ResourceStub {
	res := *rs
	for _, opt := range opts {
		opt(&res)
	}

	return &res
}

func RandomSerialID() string {
	//nolint:gosec // not a security issue for tests
	return strconv.Itoa(rand.Intn(Serial4Limit))
}
