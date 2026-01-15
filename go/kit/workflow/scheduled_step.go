package workflow

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
	"github.com/robfig/cron/v3"
)

// ScheduledStepOption configures scheduled step behavior
type ScheduledStepOption func(*scheduledStepConfig)

type scheduledStepConfig struct {
	cronSched              cron.Schedule
	shouldExecuteAtStartUp bool
	startTime              *time.Time
	endTime                *time.Time
}

// StepScheduledAt creates a step that executes on a cron schedule
func StepScheduledAt(spec string, shouldExecuteAtStartUp bool) ScheduledStepOption {
	return func(s *scheduledStepConfig) {
		schedule, err := cron.ParseStandard(spec)
		if err != nil {
			panic(fmt.Errorf("invalid cron spec %q: %w", spec, err))
		}
		s.cronSched = schedule
		s.shouldExecuteAtStartUp = shouldExecuteAtStartUp
	}
}

// StepScheduledBetween sets start and end times for the scheduled step
func StepScheduledBetween(startTime, endTime *time.Time) ScheduledStepOption {
	return func(s *scheduledStepConfig) {
		s.startTime = startTime
		s.endTime = endTime
	}
}

// ScheduledStep represents a step that can be executed on a schedule
type ScheduledStep[T any] struct {
	Step[T]
	config  scheduledStepConfig
	stopCh  chan struct{}
	stopped bool
	mu      sync.RWMutex
	monitor monitoring.Monitor
	errCh   chan error // For propagating errors from scheduling goroutine
}

// NewScheduledStep creates a new scheduled step with the given name, runner function, monitor, and schedule options
func NewScheduledStep[T any](name string, runner StepRunner[T], monitor monitoring.Monitor, opts ...ScheduledStepOption) *ScheduledStep[T] {
	config := scheduledStepConfig{}
	for _, opt := range opts {
		opt(&config)
	}

	return &ScheduledStep[T]{
		Step:    NewStep(name, runner, monitor),
		config:  config,
		stopCh:  make(chan struct{}, 1), // Buffered to prevent blocking
		errCh:   make(chan error, 1),    // Buffered for error propagation
		monitor: monitor,
	}
}

// Run executes the scheduled step as part of normal workflow execution
func (s *ScheduledStep[T]) Run(ctx context.Context, initialData T) error {
	// If no cron schedule is configured, run once like a normal step
	if s.config.cronSched == nil {
		return s.Step.Run(ctx, initialData)
	}

	// Start the underlying step to accept dispatches
	go func() {
		if err := s.Step.Run(ctx, initialData); err != nil {
			// Send error to error channel
			select {
			case s.errCh <- err:
			default:
			}
		}
	}()

	// Start the scheduled execution
	go s.schedule(ctx, initialData)

	// Wait for context cancellation, explicit stop, or error
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-s.stopCh:
		return nil
	case err := <-s.errCh:
		return fmt.Errorf("scheduled step %s failed: %w", s.Step.Name(), err)
	}
}

// schedule handles the recurring execution based on cron schedule
func (s *ScheduledStep[T]) schedule(ctx context.Context, initialData T) {
	if s.config.cronSched == nil {
		return
	}

	// Wait for start time if specified
	if s.config.startTime != nil {
		s.monitor.Logger().DebugContext(ctx, "Scheduled step %s waiting until start time: %s", s.Step.Name(), s.config.startTime.Format(time.RFC3339))
		if err := s.waitUntil(ctx, *s.config.startTime); err != nil {
			s.monitor.Logger().ErrorContext(ctx, "Scheduled step %s failed to wait for start time: %v", s.Step.Name(), err)
			return
		}
	}

	// Check if we should execute immediately at startup
	if s.config.shouldExecuteAtStartUp {
		// Check if we're within the allowed time window
		if s.isWithinTimeWindow() {
			s.monitor.Logger().DebugContext(ctx, "Executing scheduled step %s at startup", s.Step.Name())
			if err := s.dispatchWithTimeout(ctx, initialData); err != nil {
				s.monitor.Logger().ErrorContext(ctx, "Scheduled step %s startup execution failed: %v", s.Step.Name(), err)
				// Send error to error channel for potential handling
				select {
				case s.errCh <- err:
				default:
				}
			}
		}
	}

	// Main scheduling loop
	for {
		select {
		case <-ctx.Done():
			s.monitor.Logger().DebugContext(ctx, "Scheduled step %s stopped due to context cancellation", s.Step.Name())
			return
		case <-s.stopCh:
			s.monitor.Logger().DebugContext(ctx, "Scheduled step %s stopped explicitly", s.Step.Name())
			return
		default:
			nextExecution := s.config.cronSched.Next(time.Now())
			s.monitor.Logger().DebugContext(ctx, "Scheduled step %s next execution at: %s", s.Step.Name(), nextExecution.Format(time.RFC3339))

			// Check if next execution is beyond end time
			if s.config.endTime != nil && nextExecution.After(*s.config.endTime) {
				s.monitor.Logger().DebugContext(ctx, "Scheduled step %s reached end time, stopping", s.Step.Name())
				return
			}

			// Wait until next execution time
			if err := s.waitUntil(ctx, nextExecution); err != nil {
				if ctx.Err() != nil {
					s.monitor.Logger().DebugContext(ctx, "Scheduled step %s wait interrupted by context: %v", s.Step.Name(), err)
				} else {
					s.monitor.Logger().ErrorContext(ctx, "Scheduled step %s failed to wait for next execution: %v", s.Step.Name(), err)
				}
				return
			}

			// Check if we're still within the time window
			if !s.isWithinTimeWindow() {
				s.monitor.Logger().DebugContext(ctx, "Scheduled step %s is outside time window, stopping", s.Step.Name())
				return
			}

			// Execute the step
			s.monitor.Logger().DebugContext(ctx, "Executing scheduled step %s", s.Step.Name())
			if err := s.dispatchWithTimeout(ctx, initialData); err != nil {
				s.monitor.Logger().ErrorContext(ctx, "Scheduled step %s execution failed: %v", s.Step.Name(), err)
				// Continue scheduling even if execution fails
			}
		}
	}
}

// isWithinTimeWindow checks if current time is within the allowed execution window
func (s *ScheduledStep[T]) isWithinTimeWindow() bool {
	now := time.Now()

	if s.config.startTime != nil && now.Before(*s.config.startTime) {
		return false
	}

	if s.config.endTime != nil && now.After(*s.config.endTime) {
		return false
	}

	return true
}

// Stop gracefully stops the scheduled step
func (s *ScheduledStep[T]) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.stopped {
		return // Already stopped
	}
	s.stopped = true

	// Close the stop channel to signal shutdown
	close(s.stopCh)

	// Also stop the underlying step
	s.Step.Stop()
}

// GetNextExecution returns the next scheduled execution time
func (s *ScheduledStep[T]) GetNextExecution() *time.Time {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.config.cronSched == nil {
		return nil
	}

	next := s.config.cronSched.Next(time.Now())

	// Check if it's within the time window
	if s.config.endTime != nil && next.After(*s.config.endTime) {
		return nil
	}

	return &next
}

// IsScheduled returns true if this step has a cron schedule
func (s *ScheduledStep[T]) IsScheduled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config.cronSched != nil
}

// GetScheduleInfo returns detailed information about the schedule configuration
func (s *ScheduledStep[T]) GetScheduleInfo() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	info := map[string]interface{}{
		"name":               s.Step.Name(),
		"has_schedule":       s.config.cronSched != nil,
		"execute_at_startup": s.config.shouldExecuteAtStartUp,
		"within_time_window": s.isWithinTimeWindow(),
	}

	if s.config.startTime != nil {
		info["start_time"] = s.config.startTime.Format(time.RFC3339)
	}

	if s.config.endTime != nil {
		info["end_time"] = s.config.endTime.Format(time.RFC3339)
	}

	if s.config.cronSched != nil {
		next := s.config.cronSched.Next(time.Now())
		info["next_execution"] = next.Format(time.RFC3339)

		if s.config.endTime != nil && next.After(*s.config.endTime) {
			info["next_execution_valid"] = false
		} else {
			info["next_execution_valid"] = true
		}
	}

	return info
}

// waitUntil waits until the specified time
func (s *ScheduledStep[T]) waitUntil(ctx context.Context, target time.Time) error {
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

// dispatchWithTimeout attempts to dispatch data with a timeout to prevent blocking
func (s *ScheduledStep[T]) dispatchWithTimeout(ctx context.Context, data T) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second) // 30-second timeout
	defer cancel()

	errCh := make(chan error, 1)
	go func() {
		errCh <- s.Step.Dispatch(data)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		return fmt.Errorf("dispatch timeout for step %s: %w", s.Step.Name(), ctx.Err())
	}
}
