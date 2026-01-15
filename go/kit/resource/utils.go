package resource

import (
	"strconv"

	"github.com/dosanma1/forge/go/kit/ptr"
)

func IDMapper[R Identifier]() func(R) string {
	return func(r R) string {
		return ID(r)
	}
}

// ID returns the id of the identifier or empty in case it's a null element.
func ID(r Identifier) string {
	if r == nil {
		return ""
	}

	return r.ID()
}

func IDPtr(r Identifier) *string {
	if r == nil {
		return nil
	}

	return ptr.Of(r.ID())
}

func IDToString[T uint | uint16 | uint32 | uint64](id T) string {
	return strconv.FormatUint(uint64(id), 10)
}

func NullableUint32ID(r Identifier) *uint32 {
	if r == nil || r.ID() == "" {
		return nil
	}

	res, err := strconv.ParseUint(r.ID(), 10, 32)
	if err != nil {
		panic(err)
	}

	uintVal := uint32(res)
	return &uintVal
}

func IDToInt(id string) int {
	res, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		panic(err)
	}
	return int(res)
}

func IDToUint64(id string) uint64 {
	res, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		panic(err)
	}
	return res
}

func IDToUint32(id string) uint32 {
	res, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		panic(err)
	}
	return uint32(res)
}

func IDToUint(id string) uint {
	res, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		panic(err)
	}
	return uint(res)
}
