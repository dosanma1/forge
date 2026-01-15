package auth

import (
	"context"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/firebase"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
)

type baseAuthenticator[R any] struct {
	tokenExtractor  TokenExtractor[R]
	contextInjector ContextInjector
	firebaseClient  firebase.Client
}

func NewBaseAuthenticator[R any](tokenExtractor TokenExtractor[R], contextInjector ContextInjector, firebaseClient firebase.Client) *baseAuthenticator[R] {
	return &baseAuthenticator[R]{
		tokenExtractor:  tokenExtractor,
		contextInjector: contextInjector,
		firebaseClient:  firebaseClient,
	}
}

func (a *baseAuthenticator[R]) ValidateToken(ctx context.Context, token Token) error {
	switch token.Type() {
	case TokenTypeFirebase:
		fallthrough
	default:
		return a.validateFirebaseToken(ctx, token.Value())
	}
}

func (a *baseAuthenticator[R]) validateFirebaseToken(ctx context.Context, token string) error {
	_, err := a.firebaseClient.Auth().VerifyIDToken(ctx, token)
	if err != nil {
		return errors.Unauthorized("Invalid token")
	}
	return nil
}
