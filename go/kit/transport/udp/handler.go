package udp

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Handler handles a UDP packet
type Handler interface {
	Handle(ctx context.Context, session Session, payload []byte) error
}

// HandlerFunc adapts a function to the Handler interface
type HandlerFunc func(ctx context.Context, session Session, payload []byte) error

func (f HandlerFunc) Handle(ctx context.Context, session Session, payload []byte) error {
	return f(ctx, session, payload)
}

// Middleware wraps a Handler
type Middleware func(Handler) Handler

// Registry allows registering handlers for opcodes
type Registry interface {
	Register(opcode uint16, handler Handler)
}

// Mux is a packet router
type Mux struct {
	handlers map[uint16]Handler
	mu       sync.RWMutex
}

// NewMux creates a new Mux
func NewMux() *Mux {
	return &Mux{
		handlers: make(map[uint16]Handler),
	}
}

// Register registers a handler for the given opcode
func (m *Mux) Register(opcode uint16, handler Handler) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.handlers[opcode] = handler
}

// Handle implements Handler
func (m *Mux) Handle(ctx context.Context, session Session, payload []byte) error {
	if len(payload) < 2 {
		return fmt.Errorf("payload too short for opcode")
	}

	// Read Opcode (Little Endian, first 2 bytes of payload)
	// Note: The 'payload' here is the UDP Body (after UDP Header).
	// We expect the standard [Opcode:2][Data...] format inside the UDP Body.
	// Wait, standard packet format is [Size:2][Opcode:2][Data...] in TCP.
	// For UDP, we typically omit Size because the UDP datagram size tells us.
	// So we assume [Opcode:2][Data...].

	opcodeVal := uint16(payload[0]) | uint16(payload[1])<<8

	m.mu.RLock()
	handler, ok := m.handlers[opcodeVal]
	m.mu.RUnlock()

	if !ok {
		// Just debug log, don't error loudly on unknown opcodes in UDP (scanning etc)
		return nil
	}

	// Pass the full payload (including Opcode) or strip it?
	// TCP handler usually decodes it. Let's pass the full payload to be consistent
	// with existing parsing logic that might expect header or manually offsets.
	// Actually, `PacketReader` usually starts reading.
	// Let's pass the data.

	start := time.Now()
	err := handler.Handle(ctx, session, payload)
	duration := time.Since(start)

	// We could add metrics here
	_ = duration

	return err
}
