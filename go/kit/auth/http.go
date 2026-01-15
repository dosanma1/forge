package auth

import (
	"net/http"

	"github.com/dosanma1/forge/go/kit/firebase"
)

type httpAuthenticator struct {
	baseAuthenticator[*http.Request]
}

func NewHttpAuthenticator(tokenExtractor TokenExtractor[*http.Request], contextInjector ContextInjector, firebaseClient firebase.Client) *httpAuthenticator {
	return &httpAuthenticator{
		baseAuthenticator: *NewBaseAuthenticator(tokenExtractor, contextInjector, firebaseClient),
	}
}

func (a *httpAuthenticator) Authenticate(r *http.Request) error {
	token, err := a.tokenExtractor.Extract(r.Context(), r)
	if err != nil {
		return err
	}

	err = a.ValidateToken(r.Context(), token)
	if err != nil {
		return err
	}

	ctx, err := a.contextInjector.Inject(r.Context(), token)
	if err != nil {
		return err
	}

	*r = *r.WithContext(ctx)

	return nil
}
