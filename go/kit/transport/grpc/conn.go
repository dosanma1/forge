package grpc

import "google.golang.org/grpc"

// Conn is a type alias to avoid multi GPRC (go and current) package imports.
type Conn *grpc.ClientConn

// ServiceDesc is a type alias to avoid multi GPRC (go and current) package imports.
type ServiceDesc *grpc.ServiceDesc

// Dial creates a client connection to the given target.
func dial(target string, opts ...grpc.DialOption) (Conn, error) {
	c, err := grpc.NewClient(target, opts...)
	if err != nil {
		return c, err
	}

	return c, nil
}
