package authtest

import (
	"context"
	"net/http"
	"strings"

	"github.com/dosanma1/forge/go/kit/auth"
	"github.com/dosanma1/forge/go/kit/errors"
	"google.golang.org/grpc/metadata"
)

type httpAuthenticator struct {
}

func NewHTTPAuthenticator() *httpAuthenticator {
	return &httpAuthenticator{}
}

func (a *httpAuthenticator) Authenticate(r *http.Request) error {
	// Always return nil for testing purposes, ignore any token validation
	return nil
}

type grpcAuthenticator struct {
}

func NewGRPCAuthenticator() *grpcAuthenticator {
	return &grpcAuthenticator{}
}

func (a *grpcAuthenticator) Authenticate(ctx context.Context, md metadata.MD) (context.Context, error) {
	authHeaders := md.Get(auth.AuthorizationHeader)
	if len(authHeaders) == 0 {
		return nil, errors.Unauthorized("Authorization header is required")
	}
	authHeader := authHeaders[0]

	token, err := auth.NewToken(
		strings.TrimPrefix(authHeader, auth.BearerPrefix),
		auth.TokenTypeFirebase,
		NewTokenClaims(strings.TrimPrefix(authHeader, auth.BearerPrefix)),
	)
	if err != nil {
		return nil, err
	}

	return auth.InjectTokenInCtx(ctx, token), nil
}
