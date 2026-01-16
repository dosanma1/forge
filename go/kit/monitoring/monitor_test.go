package monitoring_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
)

func TestInvalidMonitor(t *testing.T) {
	t.Parallel()

	t.Run("no logger", func(t *testing.T) {
		assert.PanicsWithValue(
			t, "logger cannot be nil",
			func() {
				monitoring.New(nil)
			},
		)
	})

	t.Run("valid logger", func(t *testing.T) {
		l := loggertest.NewStubLogger(t)
		m := monitoring.New(l)
		assert.NotNil(t, m)
		assert.Equal(t, l, m.Logger())
	})
}
