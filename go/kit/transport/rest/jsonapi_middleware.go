package rest

import (
	"context"
	"net/http"
	"strings"
)

// includesContextKeyType is the key used to store includes in the context
type includesContextKeyType int

const (
	includesCtxKey includesContextKeyType = iota
)

// WithJSONAPIIncludes is middleware that extracts the 'include' query parameter from the HTTP request
// and adds it to the context for later use by JSON:API encoders
func WithJSONAPIIncludes(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract the 'include' query parameter
		includeParam := r.URL.Query().Get("include")

		// If the parameter exists, parse it as a comma-separated list
		var includes []string
		if includeParam != "" {
			includes = strings.Split(includeParam, ",")
			// Trim any whitespace
			for i := range includes {
				includes[i] = strings.TrimSpace(includes[i])
			}
		}

		// Add the includes to the context
		ctx := context.WithValue(r.Context(), includesCtxKey, includes)

		// Call the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetJSONAPIIncludes extracts the includes from the context
func GetJSONAPIIncludes(ctx context.Context) []string {
	if includes, ok := ctx.Value(includesCtxKey).([]string); ok {
		return includes
	}
	return nil
}
