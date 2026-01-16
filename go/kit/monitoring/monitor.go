package monitoring

import (
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
)

type Monitor interface {
	Logger() logger.Logger
}

type monitor struct {
	l logger.Logger
}

func (m *monitor) Logger() logger.Logger {
	return m.l
}

func New(l logger.Logger) Monitor {
	if l == nil {
		panic("logger cannot be nil")
	}

	return &monitor{l: l}
}
