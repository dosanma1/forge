package tcp

import (
	"context"

	"go.uber.org/fx"
)

// Registry defines the interface for registering TCP handlers
type Registry interface {
	Register(key interface{}, handler Handler)
	RegisterFunc(key interface{}, handler func(context.Context, Session, []byte) error)
}

// Controller defines a component that registers routes to a TCP Registry (e.g. Mux)
type Controller interface {
	Register(Registry)
}

// ControllerFunc is an adapter to allow the use of ordinary functions as Controllers
type ControllerFunc func(Registry)

func (f ControllerFunc) Register(r Registry) {
	f(r)
}

// NewFxController registers a controller in the Fx dependency graph.
// The controller will be automatically picked up by FxModule.
//
// Example:
//
//	tcp.NewFxController(func() tcp.Controller {
//	    return myController
//	})
func NewFxController(ctrl any) fx.Option {
	return fx.Provide(
		fx.Annotate(
			ctrl,
			fx.ResultTags(`group:"tcpControllers"`),
			fx.As(new(Controller)),
		),
	)
}


