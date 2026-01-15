package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/dosanma1/forge/go/kit/errors"
	"google.golang.org/grpc/metadata"
)

type (
	TokenExtractor[R any] interface {
		Extract(ctx context.Context, req R) (Token, error)
	}

	Token interface {
		Claims() TokenClaims
		Value() string
		Type() TokenType
	}

	TokenClaims interface {
		Subject() string
		Expiry() time.Time
	}

	TokenType string

	jwtTokenClaims map[string]any
)

func (tt TokenType) String() string {
	return string(tt)
}

func (jtc jwtTokenClaims) Subject() string {
	return jtc.stringClaim("sub")
}

func (jtc jwtTokenClaims) Expiry() time.Time {
	return jtc.timeClaim("exp")
}

func (jtc jwtTokenClaims) timeClaim(name string) time.Time {
	val, ok := jtc[name]
	if !ok {
		return time.Time{}
	}

	if v, ok := val.(float64); ok {
		return time.Unix(int64(v), 0)
	}

	return time.Time{}
}

func (jtc jwtTokenClaims) stringClaim(name string) string {
	val, ok := jtc[name]
	if !ok {
		return ""
	}

	if valStr, ok := val.(string); ok {
		return valStr
	}

	return ""
}

const (
	TokenTypeJWT      TokenType = "JWT"
	TokenTypeFirebase TokenType = "FIREBASE"
	TokenTypeOAuth    TokenType = "OAUTH"
	TokenTypeAPIKey   TokenType = "API_KEY"
	TokenTypeCustom   TokenType = "CUSTOM"

	jwtNumParts = 3
)

type token struct {
	value  string
	typ    TokenType
	claims TokenClaims
}

func NewToken(value string, typ TokenType, claims TokenClaims) (*token, error) {
	token := &token{
		value:  value,
		typ:    typ,
		claims: claims,
	}

	if claims == nil {
		jwtParts := strings.Split(token.value, ".")
		if len(jwtParts) != jwtNumParts {
			return nil, errors.Unauthorized("invalid token")
		}

		bs, err := base64.RawURLEncoding.DecodeString(jwtParts[1])
		if err != nil {
			return nil, err
		}
		tokClaims := make(jwtTokenClaims)
		err = json.Unmarshal(bs, &tokClaims)
		if err != nil {
			return nil, err
		}
		token.claims = tokClaims
	}

	return token, nil

}

func (t *token) Claims() TokenClaims {
	return t.claims
}

func (t *token) Value() string {
	return t.value
}

func (t *token) Type() TokenType {
	return t.typ
}

type httpTokenExtractor struct {
}

func NewHTTPTokenExtractor() *httpTokenExtractor {
	return &httpTokenExtractor{}
}

func (te *httpTokenExtractor) Extract(ctx context.Context, req *http.Request) (Token, error) {
	// Extract authentication information from request
	authHeader, err := extractAuthInfo(req)
	if err != nil {
		return nil, err
	}

	// We'll default to firebase for now
	authType := TokenTypeFirebase

	token, err := NewToken(extractTokenFromHeader(authHeader, authType.String()), TokenType(authType), nil)

	return token, err
}

// extractAuthInfo validates and extracts authentication header and type
// Returns an error if authentication information is invalid
func extractAuthInfo(r *http.Request) (authHeader string, err error) {
	authHeader = r.Header.Get(AuthorizationHeader)

	// Check if auth header is present
	if authHeader == "" {
		return "", errors.Unauthorized("Authorization header is required")
	}

	return authHeader, nil
}

type grpcTokenExtractor struct {
}

func NewGrpcTokenExtractor() *grpcTokenExtractor {
	return &grpcTokenExtractor{}
}

func (te *grpcTokenExtractor) Extract(ctx context.Context, md metadata.MD) (Token, error) {
	// Extract authentication information from metadata
	authHeaders := md.Get(AuthorizationHeader)
	if len(authHeaders) == 0 {
		return nil, errors.Unauthorized("Authorization header is required")
	}
	authHeader := authHeaders[0]

	// We'll default to firebase for now
	authType := TokenTypeFirebase

	token, err := NewToken(extractTokenFromHeader(authHeader, authType.String()), TokenType(authType), nil)

	return token, err
}

// extractTokenFromHeader extracts the authentication token from the header
// based on the authentication type
func extractTokenFromHeader(authHeader, authType string) string {
	if authType != "" && TokenType(authType) == TokenTypeAPIKey {
		// API keys might be passed directly
		return authHeader
	}

	// For Bearer tokens, remove the prefix
	return strings.TrimPrefix(authHeader, BearerPrefix)
}
