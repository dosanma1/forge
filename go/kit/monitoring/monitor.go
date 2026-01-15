package monitoring

import (
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type Monitor interface {
	Logger() logger.Logger
	Tracer() tracer.Tracer
}

type monitor struct {
	l logger.Logger
	t tracer.Tracer
}

func (m *monitor) Logger() logger.Logger {
	return m.l
}

func (m *monitor) Tracer() tracer.Tracer {
	return m.t
}

func New(l logger.Logger, t tracer.Tracer) Monitor {
	if l == nil {
		panic(fields.NewErrInvalidNil(fields.Name("logger")))
	}
	if t == nil {
		panic(fields.NewErrInvalidNil(fields.Name("tracer")))
	}

	return &monitor{l: l, t: t}
}
