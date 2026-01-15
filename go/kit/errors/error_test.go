package errors

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestErrorIs(t *testing.T) {
	t.Run("errors with same code should be equal", func(t *testing.T) {
		err1 := NotFound("user", "123")
		err2 := NotFound("account", "456")

		// Both are NotFound errors, so they should be considered equal by errors.Is
		assert.True(t, errors.Is(err1, err2))
	})

	t.Run("errors with different codes should not be equal", func(t *testing.T) {
		err1 := NotFound("user", "123")
		err2 := Conflict("conflict message")

		// Different error codes, should not be equal
		assert.False(t, errors.Is(err1, err2))
	})

	t.Run("custom error should work with standard errors.Is", func(t *testing.T) {
		notFoundErr := NotFound("user", "123")
		standardErr := errors.New("standard error")

		// Should not be equal to standard error
		assert.False(t, errors.Is(notFoundErr, standardErr))
		assert.False(t, errors.Is(standardErr, notFoundErr))
	})
}
