package errors_test

import (
	"context"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
)

func TestPanicIfErr(t *testing.T) {
	t.Parallel()

	t.Run("does not panic if err is nil", func(t *testing.T) {
		t.Parallel()
		assert.NotPanics(t, func() { errors.PanicIfErr(nil) })
	})

	t.Run("panics in case of err", func(t *testing.T) {
		t.Parallel()
		err := assert.AnError
		assert.PanicsWithError(t, err.Error(), func() { errors.PanicIfErr(err) })
	})
}

func TestErrSkipper(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		skipper errors.ErrSkipper
		in      error
		want    bool
	}{
		{
			name:    "context cancellation err, skipper with no checks",
			skipper: errors.SkipErrIfOneOf(),
			in:      context.Canceled, want: false,
		},
		{
			name:    "wrapped context cancellation err skipped",
			skipper: errors.SkipContextCancelErr(),
			in:      fields.NewErrInvalid(fields.NameID, context.Canceled),
			want:    true,
		},
		{
			name:    "wrapped eof err skipped",
			skipper: errors.SkipErrIfOneOf(context.Canceled, io.EOF, assert.AnError),
			in:      fields.NewErrInvalid(fields.NameID, io.EOF),
			want:    true,
		},
		{
			name:    "wrapped eof err not skipped",
			skipper: errors.SkipErrIfOneOf(context.Canceled, assert.AnError),
			in:      fields.NewErrInvalid(fields.NameID, io.EOF),
			want:    false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t,
				test.want,
				test.skipper.SkipErr(test.in),
			)
		})
	}
}
