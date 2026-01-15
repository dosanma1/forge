// Package otel implements a tracer.Tracer using otel as a backend
package otel

import (
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"

	"go.uber.org/fx"
)

func FxModule(name string, opts ...option) fx.Option {
	return fx.Module("tracer",
		fx.Supply(
			fx.Annotate(
				opts,
				fx.ResultTags(`group:"tracerOptions,flatten"`),
			),
		),
		fx.Provide(
			fx.Annotate(
				func(opts ...option) (tracer.Tracer, error) {
					return New(name, opts...)
				},
				fx.ParamTags(`group:"tracerOptions"`),
				fx.As(new(tracer.Tracer)),
			),
		),
	)
}
