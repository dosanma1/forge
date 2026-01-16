package rest

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
)

var ErrResponseWrongType = errors.New("response is not of the expected type")

type (
	ErrorEncoder func(ctx context.Context, err error, w http.ResponseWriter)

	EncodeResponseFunc func(context.Context, http.ResponseWriter, interface{}) error
)

type encoderConfig struct {
	allowsEmptyRes bool
}

type encoderOpt func(c *encoderConfig)

func EncoderAllowsEmptyRes(emptyResAllowed bool) encoderOpt {
	return func(c *encoderConfig) {
		c.allowsEmptyRes = emptyResAllowed
	}
}

func defaultEncoderOpts() []encoderOpt {
	return []encoderOpt{EncoderAllowsEmptyRes(false)}
}

func NewHTTPEncoder[I any](
	f func(context.Context, http.ResponseWriter, I) error,
	opts ...encoderOpt,
) EncodeResponseFunc {
	c := new(encoderConfig)
	for _, opt := range append(defaultEncoderOpts(), opts...) {
		opt(c)
	}

	return func(ctx context.Context, w http.ResponseWriter, in any) error {
		if in == nil && c.allowsEmptyRes {
			var zero I
			return f(ctx, w, zero)
		}
		cast, ok := in.(I)
		if in != nil && !ok {
			return ErrResponseWrongType
		}
		return f(ctx, w, cast)
	}
}

func NewEmptyHTTPEncoder(statusCode int) EncodeResponseFunc {
	return func(ctx context.Context, w http.ResponseWriter, in any) error {
		w.WriteHeader(statusCode)
		return nil
	}
}

func newHTTPEncoderWithContentType[I any](
	contentType string,
	f func(context.Context, http.ResponseWriter, I) error,
) EncodeResponseFunc {
	return NewHTTPEncoder(
		func(ctx context.Context, w http.ResponseWriter, in I) error {
			w.Header().Set("Content-Type", contentType)

			return f(ctx, w, in)
		},
	)
}

func RestJSONEncoder[I, O any](
	itemMapper func(in I) O,
	successCode int,
) func(context.Context, http.ResponseWriter, any) error {
	return newHTTPEncoderWithContentType(
		"application/json; charset=utf-8",
		func(ctx context.Context, w http.ResponseWriter, in I) error {
			w.WriteHeader(successCode)
			return json.NewEncoder(w).Encode(itemMapper(in))
		},
	)
}
