package udp

import "go.uber.org/fx"

// Module exports the UDP components
var Module = fx.Module("transport_udp",
	fx.Provide(
		NewMux,
		func(mux *Mux) Registry { return mux },
		func(mux *Mux) Handler { return mux },
	),
)
