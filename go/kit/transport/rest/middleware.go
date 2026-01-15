package rest

import "net/http"

type MiddlewareFunc func(http.Handler) http.Handler

func (f MiddlewareFunc) Intercept(h http.Handler) http.Handler {
	return f(h)
}

// Middleware defines a REST compatible middleware
type Middleware interface {
	Intercept(http.Handler) http.Handler
}

func chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	h := handler
	for _, m := range middlewares {
		h = m.Intercept(h)
	}
	return h
}
