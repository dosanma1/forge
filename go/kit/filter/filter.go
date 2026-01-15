// Package filter ...
package filter

import (
	"fmt"

	"github.com/dosanma1/forge/go/kit/fields"
)

const (
	FieldNameFilter  fields.Name = "filter"
	FieldNameFilters fields.Name = "filters"
)

type Operator uint

const (
	OpUndefined Operator = iota
	OpEq
	OpNEq
	OpGT
	OpGTEq
	OpLT
	OpLTEq
	OpIn
	OpNotIn
	OpLike
	OpBetween
	OpContains
	OpContainsLike
	OpIs
	OpIsNot
)

func (op Operator) Valid() bool {
	return op == OpEq || op == OpNEq ||
		op == OpGT || op == OpGTEq ||
		op == OpLT || op == OpLTEq ||
		op == OpIn || op == OpNotIn ||
		op == OpLike || op == OpBetween ||
		op == OpContains || op == OpContainsLike ||
		op == OpIs || op == OpIsNot
}

func (op Operator) String() string {
	switch op {
	case OpEq:
		return "=="
	case OpNEq:
		return "!="
	case OpGT:
		return ">"
	case OpGTEq:
		return ">="
	case OpLT:
		return "<"
	case OpLTEq:
		return "<="
	case OpIn:
		return "IN"
	case OpNotIn:
		return "NOT IN"
	case OpLike:
		return "LIKE"
	case OpBetween:
		return "BETWEEN"
	case OpContains:
		return "@>"
	case OpContainsLike:
		return "LIKE ANY"
	case OpIs:
		return "IS"
	case OpIsNot:
		return "IS NOT"
	case OpUndefined:
		return ""
	default:
		return ""
	}
}

type Field[T any] interface {
	Value() T
	Name() string
	Update(val T)
}

type field[T any] struct {
	val  T
	name string
}

func (f field[T]) Name() string {
	return f.name
}

func (f field[T]) Value() T {
	return f.val
}

func (f *field[T]) Update(val T) {
	f.val = val
}

func newField[T any](name string, val T) Field[T] {
	if len(name) < 1 {
		panic("invalid filter name")
	}

	return &field[T]{
		name: name,
		val:  val,
	}
}

type FieldFilter[T any] interface {
	Field[T]
	Operator() Operator
}

type fieldFilter[T any] struct {
	Field[T]
	operator Operator
}

func (f fieldFilter[T]) Operator() Operator {
	return f.operator
}

func NewFieldFilter[T any](operator Operator, name string, val T) FieldFilter[T] {
	if !operator.Valid() {
		panic(fmt.Sprintf("invalid operator: %v", operator))
	}
	f := &fieldFilter[T]{
		Field:    newField(name, val),
		operator: operator,
	}

	return f
}

func Eq[T any](name string, val T) FieldFilter[T] {
	return NewFieldFilter(
		OpEq, name, val,
	)
}

func GTEq[T any](name string, val T) FieldFilter[T] {
	return NewFieldFilter(
		OpGTEq, name, val,
	)
}

func LTEq[T any](name string, val T) FieldFilter[T] {
	return NewFieldFilter(
		OpLTEq, name, val,
	)
}

func Like[T any](name string, val T) FieldFilter[T] {
	return NewFieldFilter(
		OpLike, name, val,
	)
}

func In[T any](name string, vals ...T) FieldFilter[[]T] {
	return NewFieldFilter(
		OpIn, name, vals,
	)
}

func Between[T any](name string, from, upTo T) FieldFilter[[]T] {
	return NewFieldFilter(
		OpLike, name, []T{from, upTo},
	)
}
