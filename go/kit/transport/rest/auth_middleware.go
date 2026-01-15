package rest

import (
	"net/http"
)

type HTTPAuthenticator interface {
	Authenticate(req *http.Request) error
}

type AuthMiddleware struct {
	authenticator HTTPAuthenticator
	errorEncoder  ErrorEncoder
}

type authMiddlewareOption func(*AuthMiddleware)

func defaultAuthMiddlewareOpts() []authMiddlewareOption {
	return []authMiddlewareOption{
		WithErrorEncoder(JsonApiErrorEncoder),
	}
}

func WithErrorEncoder(encoder ErrorEncoder) authMiddlewareOption {
	return func(m *AuthMiddleware) {
		m.errorEncoder = encoder
	}
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(authenticator HTTPAuthenticator, opts ...authMiddlewareOption) *AuthMiddleware {
	middleware := &AuthMiddleware{
		authenticator: authenticator,
	}
	for _, opt := range append(defaultAuthMiddlewareOpts(), opts...) {
		opt(middleware)
	}
	return middleware
}

// Intercept implements the rest.Middleware interface
func (m *AuthMiddleware) Intercept(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := m.authenticator.Authenticate(r)
		if err != nil {
			m.errorEncoder(r.Context(), err, w)
			return
		}

		next.ServeHTTP(w, r)

	})
}

// RequireAuthentication creates a middleware that requires authentication
func RequireAuthentication(handler http.Handler, authenticator HTTPAuthenticator, opts ...authMiddlewareOption) http.Handler {
	return chain(handler, NewAuthMiddleware(authenticator, opts...))
}
