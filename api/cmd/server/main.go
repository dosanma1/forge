package main

import (
	"os"

	"github.com/dosanma1/forge/api/internal"
	"github.com/dosanma1/forge/go/kit/transport/rest"
	"go.uber.org/fx"
)

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	app := fx.New(
		fx.Supply(fx.Annotate(
			rest.WithAddress(":"+port),
			fx.ResultTags(`group:"restGatewayOptions"`),
		)),
		rest.FxModule(),
		internal.Module,
	)

	app.Run()
}
