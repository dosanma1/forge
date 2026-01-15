package auth

import (
	"context"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/firebase"
	"google.golang.org/grpc/metadata"
)

type grpcAuthenticator struct {
	baseAuthenticator[metadata.MD]
}

func NewGrpcAuthenticator(tokenExtractor TokenExtractor[metadata.MD], contextInjector ContextInjector, firebaseClient firebase.Client) *grpcAuthenticator {
	return &grpcAuthenticator{
		baseAuthenticator: *NewBaseAuthenticator(tokenExtractor, contextInjector, firebaseClient),
	}
}

func (a *grpcAuthenticator) Authenticate(ctx context.Context, md metadata.MD) (context.Context, error) {
	token, err := a.tokenExtractor.Extract(ctx, md)
	if err != nil {
		return ctx, err
	}

	err = a.ValidateToken(ctx, token)
	if err != nil {
		return ctx, err
	}

	ctx, err = a.contextInjector.Inject(ctx, token)
	if err != nil {
		return ctx, err
	}
	return ctx, nil
}

func (a *grpcAuthenticator) ValidateToken(ctx context.Context, token Token) error {
	switch token.Type() {
	case TokenTypeFirebase:
		fallthrough
	default:
		return a.validateFirebaseToken(ctx, token.Value())
	}
}

func (a *grpcAuthenticator) validateFirebaseToken(ctx context.Context, token string) error {
	_, err := a.firebaseClient.Auth().VerifyIDToken(ctx, token)
	if err != nil {
		return errors.Unauthorized("Invalid token")
	}
	return nil
}
