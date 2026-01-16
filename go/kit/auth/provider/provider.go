package provider

import "context"

// UserInfo contains authenticated user information
type UserInfo struct {
	ProviderUID   string
	Email         string
	EmailVerified bool
	DisplayName   string
}

// Provider is a generic authentication provider interface
type Provider interface {
	ValidateToken(ctx context.Context, token string) (*UserInfo, error)
	Name() string
}
