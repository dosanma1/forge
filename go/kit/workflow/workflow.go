package workflow

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
)

// Workflow follows the simplified pattern with direct data passing
type Workflow[T any] struct {
	name              string
	steps             map[string]Step[T]
	monitor           monitoring.Monitor
	connectionManager *StreamConnectionManager[T]

	once      sync.Once
	errorChan chan error
	stopChan  chan struct{}

	startAt *time.Time
	endAt   *time.Time
}

// WorkflowOption configures the workflow
type WorkflowOption[T any] func(*Workflow[T])

// New creates a new workflow following the simplified pattern
func New[T any](name string, monitor monitoring.Monitor, opts ...WorkflowOption[T]) *Workflow[T] {
	w := &Workflow[T]{
		name:              name,
		steps:             make(map[string]Step[T]),
		monitor:           monitor,
		connectionManager: NewStreamConnectionManager[T](monitor),
		errorChan:         make(chan error, 10),
		stopChan:          make(chan struct{}),
	}

	for _, opt := range opts {
		opt(w)
	}

	return w
}

// WithSteps adds steps to the workflow
func WithSteps[T any](steps ...Step[T]) WorkflowOption[T] {
	return func(w *Workflow[T]) {
		for _, step := range steps {
			w.steps[step.Name()] = step
		}
	}
}

// WithSchedule sets the workflow execution time window
func WithSchedule[T any](startAt, endAt *time.Time) WorkflowOption[T] {
	return func(w *Workflow[T]) {
		w.startAt = startAt
		w.endAt = endAt
	}
}

// Run executes the workflow with the given initial data
func (w *Workflow[T]) Run(ctx context.Context, initialData T, startSteps ...string) error {
	// Create a cancellation context with a done channel for coordination
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Use a buffered channel to avoid blocking when stopping
	stopRequested := make(chan struct{}, 1)

	// Start a goroutine to handle stop signals
	go func() {
		select {
		case <-w.stopChan:
			// Notify that stop was requested
			select {
			case stopRequested <- struct{}{}:
			default:
				// Channel full, already stopping
			}
		case <-ctx.Done():
			// Parent context cancelled
		}
	}()

	// Handle scheduling
	if w.startAt != nil {
		w.monitor.Logger().DebugContext(ctx, "workflow will start at: %s", w.startAt.String())
		if err := w.waitUntil(ctx, *w.startAt); err != nil {
			return err
		}
	}

	// Handle deadline
	workCtx := ctx
	if w.endAt != nil {
		var deadlineCancel context.CancelFunc
		workCtx, deadlineCancel = context.WithDeadline(ctx, *w.endAt)
		defer deadlineCancel()
	}

	// Start all steps
	if err := w.executeWorkflow(workCtx, initialData); err != nil {
		w.monitor.Logger().ErrorContext(workCtx, "workflow execution failed: %v", err)
		return err
	}

	// Start execution from specified steps
	for _, stepName := range startSteps {
		w.monitor.Logger().DebugContext(workCtx, "starting execution from step: %s", stepName)
		if err := w.GoToStep(stepName, initialData); err != nil {
			w.monitor.Logger().ErrorContext(workCtx, "failed to start step %s: %v", stepName, err)
			return err
		}
	}

	// Wait for completion
	select {
	case <-stopRequested:
		w.monitor.Logger().InfoContext(workCtx, "workflow stopped by user request")
		cancel()
		return nil // User requested stop is not an error
	case <-workCtx.Done():
		if workCtx.Err() == context.DeadlineExceeded {
			w.monitor.Logger().InfoContext(workCtx, "workflow stopped due to deadline exceeded")
			return nil // Treat deadline exceeded as graceful stop
		}
		if workCtx.Err() == context.Canceled {
			w.monitor.Logger().InfoContext(workCtx, "workflow stopped due to cancellation")
			return nil // Treat cancellation as graceful stop, not an error
		}
		return workCtx.Err()
	case err := <-w.errorChan:
		return err
	}
}

// executeWorkflow starts all steps concurrently
func (w *Workflow[T]) executeWorkflow(ctx context.Context, initialData T) error {
	w.once.Do(func() {
		w.monitor.Logger().DebugContext(ctx, "starting workflow")

		for _, step := range w.steps {
			stepCopy := step
			go func() {
				if err := stepCopy.Run(ctx, initialData); err != nil {
					// Don't treat context cancellation as an error - it's expected during shutdown
					if ctx.Err() == context.Canceled {
						w.monitor.Logger().DebugContext(ctx, "Step %s stopped: %v", stepCopy.Name(), err)
						return
					}

					w.monitor.Logger().ErrorContext(ctx, "step %s failed: %v", stepCopy.Name(), err)
					// Send error to workflow error channel
					select {
					case w.errorChan <- fmt.Errorf("step %s failed: %w", stepCopy.Name(), err):
					default:
						// Channel full, log but don't block
						w.monitor.Logger().ErrorContext(ctx, "workflow error channel full, dropping error from step %s", stepCopy.Name())
					}
				}
			}()
		}
	})

	return nil
}

// GetConnectionManager returns the connection manager for shared stream sources
func (w *Workflow[T]) GetConnectionManager() *StreamConnectionManager[T] {
	return w.connectionManager
}

// GoToStep dispatches data to a specific step
func (w *Workflow[T]) GoToStep(stepName string, data T) error {
	step, ok := w.steps[stepName]
	if !ok {
		return fmt.Errorf("step %s not found", stepName)
	}

	return step.Dispatch(data)
}

// Stop gracefully stops the workflow
func (w *Workflow[T]) Stop() {
	select {
	case w.stopChan <- struct{}{}:
		// Signal sent successfully
	default:
		// Channel might be full or closed, which is okay
	}
}

// waitUntil waits until the specified time
func (w *Workflow[T]) waitUntil(ctx context.Context, target time.Time) error {
	now := time.Now()
	if target.Before(now) {
		return nil
	}

	duration := target.Sub(now)
	select {
	case <-time.After(duration):
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
