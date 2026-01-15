package workflow

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/dosanma1/forge/go/kit/transport/websocket"
)

// Step represents a workflow step that can be executed
type Step[T any] interface {
	// Name returns the unique identifier for this step
	Name() string

	// Dispatch sends data to this step for processing
	Dispatch(data T) error

	// Run starts the step's execution loop
	Run(ctx context.Context, initialData T) error

	// Stop gracefully stops the step
	Stop()
}

// StepRunner is a function type for step execution logic
// It receives data, processes it, and returns updated data
type StepRunner[T any] func(ctx context.Context, data T) (T, error)

// StreamSource represents a generic interface for streaming data sources
type StreamSource[T any] interface {
	websocket.Service
}

// BaseStep provides a basic implementation following the simplified pattern
type BaseStep[T any] struct {
	name    string
	runner  StepRunner[T]
	monitor monitoring.Monitor

	// Channels for communication
	dispatcher chan T
	errChan    chan error
	stopChan   chan struct{}
}

// NewStep creates a new step following the simplified pattern
func NewStep[T any](name string, runner StepRunner[T], monitor monitoring.Monitor) Step[T] {
	return &BaseStep[T]{
		name:       name,
		runner:     runner,
		monitor:    monitor,
		dispatcher: make(chan T, 10), // Buffered channel for step dispatching
		errChan:    make(chan error, 1),
		stopChan:   make(chan struct{}),
	}
}

func (s *BaseStep[T]) Name() string {
	return s.name
}

func (s *BaseStep[T]) Dispatch(data T) error {
	select {
	case s.dispatcher <- data:
		return nil
	case <-time.After(5 * time.Second):
		return fmt.Errorf("timeout dispatching data to step %s", s.name)
	}
}

func (s *BaseStep[T]) Run(ctx context.Context, initialData T) error {
	// Create a context that can be cancelled by either the parent context or our stop channel
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Listen for stop signals in a separate goroutine
	go func() {
		select {
		case <-s.stopChan:
			cancel()
		case <-ctx.Done():
			// Parent context was cancelled
		}
	}()

	s.monitor.Logger().DebugContext(ctx, "Starting step %s", s.name)

	for {
		select {
		case <-ctx.Done():
			s.monitor.Logger().DebugContext(ctx, "Step %s stopped: %v", s.name, ctx.Err())
			return ctx.Err()

		case data := <-s.dispatcher:
			s.monitor.Logger().DebugContext(ctx, "Step %s processing data", s.name)

			// Process the data
			_, err := s.runner(ctx, data)
			if err != nil {
				s.monitor.Logger().ErrorContext(ctx, "Step %s failed: %v", s.name, err)
				return err
			}

			s.monitor.Logger().DebugContext(ctx, "Step %s completed successfully", s.name)

		case err := <-s.errChan:
			return err
		}
	}
}

func (s *BaseStep[T]) Stop() {
	select {
	case s.stopChan <- struct{}{}:
		// Signal sent successfully
	default:
		// Channel might be full or closed, which is okay
	}
}

// BlockingStep provides a step implementation that allows only one execution at a time
// This is useful for operations that must be executed exclusively, like position management
type BlockingStep[T any] struct {
	name    string
	runner  StepRunner[T]
	monitor monitoring.Monitor

	// Channels for communication
	dispatcher chan T
	errChan    chan error
	stopChan   chan struct{}

	// Mutex to ensure only one operation at a time
	operationMutex sync.Mutex
}

// NewBlockingStep creates a new blocking step that ensures exclusive execution
func NewBlockingStep[T any](name string, runner StepRunner[T], monitor monitoring.Monitor) Step[T] {
	return &BlockingStep[T]{
		name:       name,
		runner:     runner,
		monitor:    monitor,
		dispatcher: make(chan T, 1), // Buffered to allow non-blocking sends
		errChan:    make(chan error, 1),
		stopChan:   make(chan struct{}),
	}
}

func (s *BlockingStep[T]) Name() string {
	return s.name
}

func (s *BlockingStep[T]) Dispatch(data T) error {
	select {
	case s.dispatcher <- data:
		return nil
	default:
		// If channel is full, it means there's already a pending operation
		s.monitor.Logger().DebugContext(context.Background(), "BlockingStep %s: Operation already in progress, skipping", s.name)
		return nil // Don't error, just skip
	}
}

func (s *BlockingStep[T]) Run(ctx context.Context, initialData T) error {
	s.monitor.Logger().DebugContext(ctx, "Starting blocking step: %s", s.name)

	for {
		select {
		case <-ctx.Done():
			s.monitor.Logger().DebugContext(ctx, "BlockingStep %s stopped due to context cancellation", s.name)
			return ctx.Err()

		case <-s.stopChan:
			s.monitor.Logger().DebugContext(ctx, "BlockingStep %s stopped by user request", s.name)
			return nil

		case data := <-s.dispatcher:
			// Use mutex to ensure exclusive execution
			s.operationMutex.Lock()

			s.monitor.Logger().DebugContext(ctx, "BlockingStep %s: Starting exclusive operation", s.name)

			_, err := s.runner(ctx, data)
			if err != nil {
				s.monitor.Logger().ErrorContext(ctx, "BlockingStep %s failed: %v", s.name, err)
				s.operationMutex.Unlock()
				return err
			}

			s.monitor.Logger().DebugContext(ctx, "BlockingStep %s: Exclusive operation completed successfully", s.name)
			s.operationMutex.Unlock()

		case err := <-s.errChan:
			return err
		}
	}
}

func (s *BlockingStep[T]) Stop() {
	select {
	case s.stopChan <- struct{}{}:
		// Signal sent successfully
	default:
		// Channel might be full or closed, which is okay
	}
}
