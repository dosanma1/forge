package tcp

import (
	"context"
	"fmt"
	"sync"
)

// Mux sends packets to registered handlers
type Mux struct {
	mu        sync.RWMutex
	extractor func([]byte) (interface{}, error)
	handlers  map[interface{}]Handler
}

// NewMux creates a new Mux with the given ID extractor.
// extractor must return a comparable value (map key).
func NewMux(extractor func([]byte) (interface{}, error)) *Mux {
	return &Mux{
		extractor: extractor,
		handlers:  make(map[interface{}]Handler),
	}
}

// Handle implements Handler interface
func (m *Mux) Handle(ctx context.Context, session Session, packet []byte) error {
	id, err := m.extractor(packet)
	if err != nil {
		return fmt.Errorf("failed to extract mux key: %w", err)
	}

	m.mu.RLock()
	handler, ok := m.handlers[id]
	m.mu.RUnlock()
	
	if !ok {
		return fmt.Errorf("no handler registered for key %v", id)
	}
	
	return handler.Handle(ctx, session, packet)
}

// Register registers a handler for a specific key
func (m *Mux) Register(key interface{}, handler Handler) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.handlers[key] = handler
}

// RegisterFunc registers a handler function for a specific key
func (m *Mux) RegisterFunc(key interface{}, handler func(context.Context, Session, []byte) error) {
	m.Register(key, HandlerFunc(handler))
}
