package monitoringtest

import (
	"testing"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
)

type monitorStubOpt func(m *monitor)

func WithLogger(l logger.Logger) monitorStubOpt {
	return func(m *monitor) {
		m.log = l
	}
}

func WithTracer(t tracer.Tracer) monitorStubOpt {
	return func(m *monitor) {
		m.trace = t
	}
}

type monitor struct {
	trace tracer.Tracer
	log   logger.Logger
}

func (m *monitor) Logger() logger.Logger {
	return m.log
}

func (m *monitor) Tracer() tracer.Tracer {
	return m.trace
}

func defaultMonitorOpts(t *testing.T) []monitorStubOpt {
	t.Helper()

	return []monitorStubOpt{
		WithLogger(loggertest.NewStubLogger(t)),
		WithTracer(tracertest.NewRecorderTracer()),
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
