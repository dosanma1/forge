package auth

import (
	"net/http"

	"github.com/dosanma1/forge/go/kit/firebase"
	"go.uber.org/fx"
	"google.golang.org/grpc/metadata"
)

func FxModule() fx.Option {
	return fx.Module(
		"auth",
		firebase.FxModule(),
		fx.Provide(
			fx.Annotate(NewTokenContextInjector, fx.As(new(ContextInjector))),
			fx.Annotate(NewHTTPTokenExtractor, fx.As(new(TokenExtractor[*http.Request]))),
			fx.Annotate(NewGrpcTokenExtractor, fx.As(new(TokenExtractor[metadata.MD]))),
		),
	)
}
