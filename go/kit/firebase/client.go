package firebase

import (
	"context"
	"os"
	"strconv"
	"strings"

	firebase "firebase.google.com/go/v4"
	firebaseAuth "firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

// ----------------------------------------------------------------------------- Contracts

type (
	// Client interface (similar to TradingClient pattern)
	Client interface {
		Auth() AuthAPI
		AuthClient() *firebaseAuth.Client
	}

	AuthAPI interface {
		VerifyIDToken(ctx context.Context, idToken string) (TokenClaims, error)
	}

	TokenClaims interface {
		ID() string
		Email() string
		EmailVerified() bool
		Claims() map[string]interface{}
	}
)

const (
	//nolint: gosec // credentials are not here, it's just the envvar name
	appCredsEnvarName = "GOOGLE_APPLICATION_CREDENTIALS"
)

// ----------------------------------------------------------------------------- Client Implementation

type (
	client struct {
		authCli *firebaseAuth.Client

		auth AuthAPI
	}

	clientOption func(c *clientConfig)

	clientConfig struct {
		firebaseOpts []option.ClientOption
	}

	authService struct {
		auth *firebaseAuth.Client
	}

	firebaseTokenDTO struct {
		id            string
		email         string
		emailVerified bool
		claims        map[string]interface{}
	}
)

func WithClientFirebaseOpts(opts ...option.ClientOption) clientOption {
	return func(c *clientConfig) {
		c.firebaseOpts = opts
	}
}

func jsonCredsFromEnv() option.ClientOption {
	appCreds := os.Getenv(appCredsEnvarName)
	if strings.HasPrefix(appCreds, "\"") {
		creds, err := strconv.Unquote(appCreds)
		if err != nil {
			panic(err)
		}
		appCreds = creds
	}

	return option.WithCredentialsJSON([]byte(appCreds))
}

func defaultClientOpts() []clientOption {
	return []clientOption{WithClientFirebaseOpts(jsonCredsFromEnv())}
}

func NewClient(opts ...clientOption) *client {
	c := new(clientConfig)
	for _, opt := range append(defaultClientOpts(), opts...) {
		opt(c)
	}
	appContext := context.Background()
	app, err := firebase.NewApp(appContext, nil, c.firebaseOpts...)
	if err != nil {
		panic(err)
	}

	authCli, err := app.Auth(appContext)
	if err != nil {
		panic(err)
	}

	return &client{
		authCli: authCli,
		auth:    &authService{auth: authCli},
	}
}

func (c *client) Auth() AuthAPI {
	return c.auth
}

func (c *client) AuthClient() *firebaseAuth.Client {
	return c.authCli
}

// ----------------------------------------------------------------------------- Auth Implementation

func (s *authService) VerifyIDToken(ctx context.Context, idToken string) (TokenClaims, error) {
	token, err := s.auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, err
	}

	email, _ := token.Claims["email"].(string)
	emailVerified, _ := token.Claims["email_verified"].(bool)

	return &firebaseTokenDTO{
		id:            token.UID,
		email:         email,
		emailVerified: emailVerified,
		claims:        token.Claims,
	}, nil
}

// ----------------------------------------------------------------------------- Interface Implementations

// TokenClaims interface implementation
func (t *firebaseTokenDTO) ID() string                     { return t.id }
func (t *firebaseTokenDTO) Email() string                  { return t.email }
func (t *firebaseTokenDTO) EmailVerified() bool            { return t.emailVerified }
func (t *firebaseTokenDTO) Claims() map[string]interface{} { return t.claims }
