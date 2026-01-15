package workflow

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sync"

	"github.com/dosanma1/forge/go/kit/monitoring"
)

// OnConnectCallback is called when the stream source is connected
// It receives the source and should set up the necessary subscriptions
type OnConnectCallback[T any] func(ctx context.Context, source StreamSource[T]) error

// StreamingStep processes continuous data from a StreamSource
type StreamingStep[T any] struct {
	name              string
	source            StreamSource[T]
	onConnect         OnConnectCallback[T]
	monitor           monitoring.Monitor
	connectionManager *StreamConnectionManager[T]

	// Channels for communication
	stopChan chan struct{}

	// State management
	mu      sync.RWMutex
	running bool
	cancel  context.CancelFunc
}

// NewStreamingStep creates a new streaming step
func NewStreamingStep[T any](
	brokerID string,
	source StreamSource[T],
	onConnect OnConnectCallback[T],
	monitor monitoring.Monitor,
) Step[T] {
	return &StreamingStep[T]{
		name:      fmt.Sprintf("streaming-%s", brokerID),
		source:    source,
		onConnect: onConnect,
		monitor:   monitor,
		stopChan:  make(chan struct{}),
	}
}

// NewStreamingStepWithConnectionManager creates a new streaming step with shared connection management
func NewStreamingStepWithConnectionManager[T any](
	brokerID string,
	source StreamSource[T],
	onConnect OnConnectCallback[T],
	monitor monitoring.Monitor,
	connectionManager *StreamConnectionManager[T],
) Step[T] {
	return &StreamingStep[T]{
		name:              fmt.Sprintf("streaming-%s", brokerID),
		source:            source,
		onConnect:         onConnect,
		monitor:           monitor,
		connectionManager: connectionManager,
		stopChan:          make(chan struct{}),
	}
}

func (s *StreamingStep[T]) Name() string {
	return s.name
}

func (s *StreamingStep[T]) Dispatch(data T) error {
	// For streaming steps, dispatch is handled by the stream source
	// This method is mainly for compatibility with the Step interface
	return fmt.Errorf("dispatch not supported for streaming step %s - data flows through subscriptions", s.name)
}

// Run implements the Step interface for StreamingStep
func (s *StreamingStep[T]) Run(ctx context.Context, initialData T) error {
	if s.source == nil {
		return errors.New("source cannot be nil")
	}

	var streamSource StreamSource[T]

	// Use shared connection manager if available, otherwise use direct connection
	if s.connectionManager != nil {
		// Extract broker ID from the step name (remove "streaming-" prefix with optional number)
		streamingPattern := regexp.MustCompile(`^streaming-\d*-(.*)$`)
		brokerID := streamingPattern.ReplaceAllString(s.name, "$1")

		// If the result is empty or just a dash, use the original name
		if brokerID == "" || brokerID == "-" {
			brokerID = s.name
		}

		sharedSource := s.connectionManager.GetOrCreateConnection(brokerID, s.source)
		streamSource = sharedSource
	} else {
		// Use direct connection
		streamSource = s.source
	}

	// Start the stream source
	if err := streamSource.Start(); err != nil {
		return fmt.Errorf("failed to start stream: %w", err)
	}
	defer streamSource.Stop()

	// Set up the subscription using the onConnect callback
	if s.onConnect != nil {
		if err := s.onConnect(ctx, streamSource); err != nil {
			return fmt.Errorf("onConnect callback failed: %w", err)
		}
	}

	// The streaming step runs indefinitely until context is cancelled
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-s.stopChan:
		return nil
	}
}

func (s *StreamingStep[T]) Stop() {
	select {
	case s.stopChan <- struct{}{}:
		// Signal sent successfully
	default:
		// Channel might be full or closed, which is okay
	}

	// Also cancel context to ensure immediate stop
	s.mu.RLock()
	if s.cancel != nil {
		s.cancel()
	}
	s.mu.RUnlock()
}

// IsStreaming returns true if the step is currently streaming data
func (s *StreamingStep[T]) IsStreaming() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.running
}

// GetStreamSource returns the underlying stream source
func (s *StreamingStep[T]) GetStreamSource() StreamSource[T] {
	return s.source
}
