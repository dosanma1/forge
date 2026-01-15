package rediscli

import (
	"context"
	"fmt"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
)

type wrappedLogger struct{ logger.Logger }

func (l wrappedLogger) Printf(ctx context.Context, format string, v ...any) {
	l.DebugContext(ctx, fmt.Sprintf(format, v...))
}

func newLogger(m monitoring.Monitor) wrappedLogger {
	return wrappedLogger{m.Logger()}
}
