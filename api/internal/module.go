package internal

import (
	"github.com/dosanma1/forge/api/internal/global"
	"github.com/dosanma1/forge/go/kit/transport/rest"
	"go.uber.org/fx"
)

// Module exports the Fx module for this service.
var Module = fx.Module("api",
	fx.Options(
		global.Module,
		rest.NewFxMiddleware(rest.NewCORSMiddleware),
	),
)
