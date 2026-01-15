// Package tracermodule exposes a default fx.Option with an appropriate tracer to be used on main files.
package tracermodule

import (
	"context"
	"log"
	"strings"

	"github.com/kelseyhightower/envconfig"
	"go.uber.org/fx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/appinsights"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/otel"
)

type Configuration struct {
	ServiceName string `required:"true" envconfig:"SVC_NAME"`
	TracerConn  string `required:"true" envconfig:"TRACER_CONN"`
}

func FxModule() fx.Option {
	cfg := Configuration{}
	var tracerOpts fx.Option

	err := envconfig.Process("", &cfg)
	if err != nil {
		panic(err)
	}

	tracerConn := strings.Split(cfg.TracerConn, " ")

	if len(tracerConn) > 1 {
		tracerName := tracerConn[0]
		connStr := tracerConn[1]

		switch tracer.TracerName(tracerName) {
		case tracer.Jaeger:
			tracerOpts = fx.Options(
				otel.FxModule(
					cfg.ServiceName,
					otel.WithOTLPGRPCExporter(
						context.Background(),
						connStr,
						grpc.WithTransportCredentials(insecure.NewCredentials())),
				),
			)
		case tracer.AzAppInsights:
			tracerOpts = fx.Options(
				appinsights.FxModule(
					cfg.ServiceName,
					appinsights.WithConnectionString(connStr),
				),
			)
		default:
			log.Fatalf("tracer %s not found", tracerName)
		}
	}

	return tracerOpts
}
