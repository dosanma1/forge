package grpc

import (
	"context"

	"github.com/dosanma1/forge/go/kit/auth"
	"google.golang.org/grpc/metadata"
)

// GRPCAuthenticator interface for gRPC authentication
type GRPCAuthenticator interface {
	Authenticate(ctx context.Context, md metadata.MD) (context.Context, error)
}

// authMiddleware struct for gRPC authentication middleware
type authMiddleware struct {
	authenticator GRPCAuthenticator
	errorHandler  func(error) error // Convert auth errors to gRPC errors
}

type authMiddlewareOption func(*authMiddleware)

// WithAuthErrorHandler sets a custom error handler for authentication errors
func WithAuthErrorHandler(handler func(error) error) authMiddlewareOption {
	return func(m *authMiddleware) {
		m.errorHandler = handler
	}
}

// defaultErrorHandler converts auth errors to gRPC errors
func defaultErrorHandler(err error) error {
	// You can customize this to return appropriate gRPC status codes
	return err
}

// NewAuthMiddleware creates a new gRPC authentication middleware
// Used internally by WithAuthentication option
func NewAuthMiddleware(authenticator GRPCAuthenticator, opts ...authMiddlewareOption) *authMiddleware {
	middleware := &authMiddleware{
		authenticator: authenticator,
		errorHandler:  defaultErrorHandler,
	}
	for _, opt := range opts {
		opt(middleware)
	}
	return middleware
}

// Intercept implements the HandlerMiddleware interface
func (m *authMiddleware) Intercept(next Handler) Handler {
	return HandlerFunc(func(ctx context.Context, req interface{}) (interface{}, error) {
		// Extract metadata from incoming context
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			md = metadata.New(map[string]string{})
		}

		// Authenticate the request
		newCtx, err := m.authenticator.Authenticate(ctx, md)
		if err != nil {
			return nil, m.errorHandler(err)
		}

		// Call the handler with the authenticated context
		return next.ServeGRPC(newCtx, req)
	})
}

// ============================================================================
// Client Authentication
// ============================================================================

// ClientAuthMiddleware creates a middleware that extracts auth token from context and adds it to metadata
func ClientAuthMiddleware() ClientMiddleware {
	return func(ctx context.Context) context.Context {
		// Get existing metadata or create new
		md, ok := metadata.FromOutgoingContext(ctx)
		if !ok {
			md = metadata.New(map[string]string{})
		} else {
			md = md.Copy()
		}

		token := auth.TokenFromCtx(ctx)
		if token != nil {
			md.Set(auth.AuthorizationHeader, auth.BearerPrefix+token.Value())
		}

		return metadata.NewOutgoingContext(ctx, md)
	}
}
