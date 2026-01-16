package monitoringtest

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
)

type monitorStubOpt func(m *monitor)

func WithLogger(l logger.Logger) monitorStubOpt {
	return func(m *monitor) {
		m.log = l
	}
}

type monitor struct {
	log logger.Logger
}

func (m *monitor) Logger() logger.Logger {
	return m.log
}

func defaultMonitorOpts(t *testing.T) []monitorStubOpt {
	t.Helper()

	return []monitorStubOpt{
		WithLogger(loggertest.NewStubLogger(t)),
	}
}

func NewMonitor(t *testing.T, opts ...monitorStubOpt) monitoring.Monitor {
	t.Helper()

	m := new(monitor)
	for _, opt := range append(defaultMonitorOpts(t), opts...) {
		opt(m)
	}

	return m
}
