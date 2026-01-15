package grpc

import (
	"context"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/transport"
	"github.com/dosanma1/forge/go/kit/transport/grpc/pb"
)

type healthServer struct {
	pb.UnimplementedHealthServiceServer

	status Handler
}

func NewHealthServer(monitor monitoring.Monitor) *healthServer {
	var (
		endpoint = func(_ context.Context, _ bool) (bool, error) { return true, nil }
		decoder  = func(_ context.Context, _ *pb.HealthRequest) (bool, error) { return true, nil }
		encoder  = func(_ context.Context, _ bool) (*pb.HealthResponse, error) {
			return &pb.HealthResponse{Status: pb.HealthResponse_S_HEALTHY}, nil
		}
	)

	return &healthServer{status: NewHandler(endpoint, decoder, encoder, monitor)}
}

func (s *healthServer) SD() ServiceDesc {
	return &pb.HealthService_ServiceDesc
}

func (s *healthServer) Status(ctx context.Context, req *pb.HealthRequest) (*pb.HealthResponse, error) {
	return Serve[*pb.HealthRequest, *pb.HealthResponse](ctx, s.status, req)
}

type (
	HealthStatus = string
	healthClient struct {
		status transport.Endpoint[any, HealthStatus]
	}
)

const (
	Healthy   HealthStatus = "healthy"
	Unhealthy HealthStatus = "unhealthy"
)

func NewHealthClient(trace tracer.Tracer, conn Conn) *healthClient {
	var (
		encode = func(_ context.Context, _ any) (*pb.HealthRequest, error) { return &pb.HealthRequest{}, nil }
		decode = func(_ context.Context, r *pb.HealthResponse) (HealthStatus, error) {
			return map[pb.HealthResponse_Status]HealthStatus{
				pb.HealthResponse_S_UNHEALTHY: Unhealthy,
				pb.HealthResponse_S_HEALTHY:   Healthy,
			}[r.Status], nil
		}
	)

	return &healthClient{
		status: NewClientEndpoint(
			conn, pb.HealthService_ServiceDesc, "Status",
			encode, decode,
		),
	}
}

func (c *healthClient) Status(ctx context.Context, r any) (HealthStatus, error) {
	return Call(ctx, c.status, r)
}
