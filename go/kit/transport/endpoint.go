package transport

import "context"

type (
	Endpoint[I, O any]      func(ctx context.Context, request I) (O, error)
	AnyEndpoint             func(ctx context.Context, request interface{}) (interface{}, error)
	EmptyResEndpoint[I any] func(ctx context.Context, request I) error
)
