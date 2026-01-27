package global

import (
	"github.com/dosanma1/forge/go/kit/transport/rest"
	"go.uber.org/fx"
)

var Module = fx.Module("global",
	fx.Provide(
		NewGlobalManager,
	),
	rest.NewFxController(NewGlobalController),
)
