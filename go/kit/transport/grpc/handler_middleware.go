package grpc

type HandlerMiddlewareFunc func(Handler) Handler

func (f HandlerMiddlewareFunc) Intercept(h Handler) Handler {
	return f(h)
}

// Middleware defines a REST compatible middleware
type HandlerMiddleware interface {
	Intercept(Handler) Handler
}

func chain(handler Handler, middlewares ...HandlerMiddleware) Handler {
	h := handler
	for _, m := range middlewares {
		h = m.Intercept(h)
	}
	return h
}
