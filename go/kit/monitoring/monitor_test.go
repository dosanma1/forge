package monitoring_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/tracertest"
)

func TestInvalidMonitor(t *testing.T) {
	t.Parallel()

	type input struct {
		l logger.Logger
		t tracer.Tracer
	}
	tests := []struct {
		name string
		in   input
		want error
	}{
		{
			name: "no logger",
			in:   input{l: nil, t: tracertest.NewRecorderTracer()},
			want: fields.NewErrInvalidNil(fields.Name("logger")),
		},
		{
			name: "no tracer",
			in:   input{l: loggertest.NewStubLogger(t), t: nil},
			want: fields.NewErrInvalidNil(fields.Name("tracer")),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			assert.PanicsWithError(
				t, test.want.Error(),
				func() {
					monitoring.New(test.in.l, test.in.t)
				},
			)
		})
	}
}
