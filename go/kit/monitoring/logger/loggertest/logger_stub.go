// Package loggertest ...
package loggertest

import (
	"testing"

	"github.com/stretchr/testify/mock"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
)

func NewStubLogger(t *testing.T) logger.Logger {
	t.Helper()

	log := NewLogger(t)
	args := []any{mock.Anything}
	for i := 0; i < 10; i++ {
		// Context-aware methods
		log.EXPECT().DebugContext(mock.Anything, mock.Anything, args...).Maybe()
		log.EXPECT().InfoContext(mock.Anything, mock.Anything, args...).Maybe()
		log.EXPECT().WarnContext(mock.Anything, mock.Anything, args...).Maybe()
		log.EXPECT().ErrorContext(mock.Anything, mock.Anything, args...).Maybe()
		log.EXPECT().CriticalContext(mock.Anything, mock.Anything, args...).Maybe()

		// Non-context methods
		log.EXPECT().Debug(mock.Anything, args...).Maybe()
		log.EXPECT().Info(mock.Anything, args...).Maybe()
		log.EXPECT().Warn(mock.Anything, args...).Maybe()
		log.EXPECT().Error(mock.Anything, args...).Maybe()
		log.EXPECT().Critical(mock.Anything, args...).Maybe()

		args = append(args, mock.Anything)
	}
	log.EXPECT().Enabled(mock.Anything).Return(true).Maybe()
	return log
}
