package rest

import (
	"net/http"
)

const IDPath = "/{id}"

type Controller interface {
	Version() string
	BasePath() string
	Endpoints() []Endpoint
}

type Endpoint interface {
	Method() string
	Path() string
	http.Handler
}

type endpoint struct {
	method string
	path   string
	http.Handler
}

func (e *endpoint) Method() string {
	return e.method
}

func (e *endpoint) Path() string {
	return e.path
}

func NewEndpoint(method, path string, handler http.Handler) Endpoint {
	return &endpoint{method: method, path: path, Handler: handler}
}

func NewCreateEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodPost, "", handler)
}

func NewGetEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodGet, IDPath, handler)
}

func NewListEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodGet, "", handler)
}

func NewUpdateEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodPut, IDPath, handler)
}

func NewPatchEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodPatch, IDPath, handler)
}

func NewDeleteEndpoint(handler http.Handler) Endpoint {
	return NewEndpoint(http.MethodDelete, IDPath, handler)
}
