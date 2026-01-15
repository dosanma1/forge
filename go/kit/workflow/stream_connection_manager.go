package workflow

import (
	"fmt"
	"sync"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/transport/websocket"
)

// StreamConnectionManager manages shared WebSocket connections for multiple steps
type StreamConnectionManager[T any] struct {
	monitor     monitoring.Monitor
	connections map[string]*sharedConnection[T] // keyed by broker identifier
	mutex       sync.RWMutex
}

// sharedConnection represents a shared WebSocket connection for a broker
type sharedConnection[T any] struct {
	source        StreamSource[T]
	refCount      int
	subscriptions map[string]*subscriptionInfo
	started       bool
	mutex         sync.RWMutex
}

// subscriptionInfo tracks subscription details
type subscriptionInfo struct {
	id       string
	topic    websocket.TopicType
	args     []string
	callback websocket.WebSocketMessageCallback
}

// NewStreamConnectionManager creates a new connection manager
func NewStreamConnectionManager[T any](monitor monitoring.Monitor) *StreamConnectionManager[T] {
	return &StreamConnectionManager[T]{
		monitor:     monitor,
		connections: make(map[string]*sharedConnection[T]),
	}
}

// GetOrCreateConnection returns a shared connection for the given broker
func (m *StreamConnectionManager[T]) GetOrCreateConnection(brokerID string, source StreamSource[T]) *SharedStreamSource[T] {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	conn, exists := m.connections[brokerID]
	if !exists {
		conn = &sharedConnection[T]{
			source:        source,
			subscriptions: make(map[string]*subscriptionInfo),
		}
		m.connections[brokerID] = conn
	}

	conn.refCount++

	return &SharedStreamSource[T]{
		brokerID:   brokerID,
		connection: conn,
		manager:    m,
	}
}

// ReleaseConnection decrements the reference count and cleans up if necessary
func (m *StreamConnectionManager[T]) ReleaseConnection(brokerID string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	conn, exists := m.connections[brokerID]
	if !exists {
		return fmt.Errorf("connection for broker %s not found", brokerID)
	}

	conn.refCount--
	if conn.refCount <= 0 {
		// Stop the connection and clean up
		if conn.started {
			if err := conn.source.Stop(); err != nil {
				m.monitor.Logger().Error("Failed to stop shared connection for broker %s: %v", brokerID, err)
			}
		}
		delete(m.connections, brokerID)
	}

	return nil
}

// SharedStreamSource wraps a shared connection and implements StreamSource
type SharedStreamSource[T any] struct {
	brokerID   string
	connection *sharedConnection[T]
	manager    *StreamConnectionManager[T]
}

// Start ensures the shared connection is started
func (s *SharedStreamSource[T]) Start() error {
	s.connection.mutex.Lock()
	defer s.connection.mutex.Unlock()

	if !s.connection.started {
		if err := s.connection.source.Start(); err != nil {
			return fmt.Errorf("failed to start shared connection for broker %s: %w", s.brokerID, err)
		}
		s.connection.started = true
		s.manager.monitor.Logger().Debug("Started shared WebSocket connection for broker %s", s.brokerID)
	}

	return nil
}

// Stop decrements the reference count (actual stop happens when ref count reaches 0)
func (s *SharedStreamSource[T]) Stop() error {
	return s.manager.ReleaseConnection(s.brokerID)
}

// Subscribe adds a subscription to the shared connection
func (s *SharedStreamSource[T]) Subscribe(topic websocket.TopicType, args []string, callback websocket.WebSocketMessageCallback) (string, error) {
	s.connection.mutex.Lock()
	defer s.connection.mutex.Unlock()

	// Subscribe through the underlying source
	subID, err := s.connection.source.Subscribe(topic, args, callback)
	if err != nil {
		return "", fmt.Errorf("failed to subscribe to topic %s for broker %s: %w", topic, s.brokerID, err)
	}

	// Track the subscription
	s.connection.subscriptions[subID] = &subscriptionInfo{
		id:       subID,
		topic:    topic,
		args:     args,
		callback: callback,
	}

	s.manager.monitor.Logger().Debug("Added subscription %s for topic %s on shared connection %s", subID, topic, s.brokerID)
	return subID, nil
}

// Unsubscribe removes a subscription from the shared connection
func (s *SharedStreamSource[T]) Unsubscribe(id string) error {
	s.connection.mutex.Lock()
	defer s.connection.mutex.Unlock()

	// Remove from tracking
	delete(s.connection.subscriptions, id)

	// Unsubscribe from the underlying source
	if err := s.connection.source.Unsubscribe(id); err != nil {
		return fmt.Errorf("failed to unsubscribe %s from broker %s: %w", id, s.brokerID, err)
	}

	s.manager.monitor.Logger().Debug("Removed subscription %s from shared connection %s", id, s.brokerID)
	return nil
}
