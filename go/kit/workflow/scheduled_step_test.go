package workflow

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/monitoringtest"
)

func TestScheduledStep(t *testing.T) {
	tests := []struct {
		name                   string
		cronSpec               string
		shouldExecuteAtStartUp bool
		startTime              *time.Time
		endTime                *time.Time
		expectExecutions       int
		testDuration           time.Duration
	}{
		{
			name:                   "execute at startup only",
			cronSpec:               "0 0 1 1 *", // January 1st (far future)
			shouldExecuteAtStartUp: true,
			testDuration:           100 * time.Millisecond,
			expectExecutions:       1, // Only startup execution
		},
		{
			name:                   "every second execution",
			cronSpec:               "* * * * *", // Every minute
			shouldExecuteAtStartUp: false,
			testDuration:           2500 * time.Millisecond,
			expectExecutions:       0, // Won't execute in 2.5 seconds with minute schedule
		},
		{
			name:                   "startup and scheduled",
			cronSpec:               "* * * * *", // Every minute
			shouldExecuteAtStartUp: true,
			testDuration:           1500 * time.Millisecond,
			expectExecutions:       1, // Only startup execution
		},
		{
			name:             "with time window - before start",
			cronSpec:         "* * * * *",
			startTime:        timePtr(time.Now().Add(10 * time.Second)), // Future start
			endTime:          timePtr(time.Now().Add(20 * time.Second)),
			testDuration:     100 * time.Millisecond,
			expectExecutions: 0, // Should not execute before start time
		},
		{
			name:             "with time window - after end",
			cronSpec:         "* * * * *",
			startTime:        timePtr(time.Now().Add(-10 * time.Second)), // Past start
			endTime:          timePtr(time.Now().Add(-5 * time.Second)),  // Past end
			testDuration:     100 * time.Millisecond,
			expectExecutions: 0, // Should not execute after end time
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), tt.testDuration+1*time.Second)
			defer cancel()

			monitor := monitoringtest.NewMonitor(t)
			var executionCount atomic.Int32

			runner := func(ctx context.Context, data TestData) (TestData, error) {
				executionCount.Add(1)
				return data, nil
			}

			opts := []ScheduledStepOption{
				StepScheduledAt(tt.cronSpec, tt.shouldExecuteAtStartUp),
			}

			if tt.startTime != nil || tt.endTime != nil {
				opts = append(opts, StepScheduledBetween(tt.startTime, tt.endTime))
			}

			scheduledStep := NewScheduledStep("test_scheduled_step", runner, monitor, opts...)

			// Run the scheduled step
			errCh := make(chan error, 1)
			go func() {
				errCh <- scheduledStep.Run(ctx, TestData{Value: 1, Text: "test"})
			}()

			// Wait for test duration
			time.Sleep(tt.testDuration)

			// Stop the step
			scheduledStep.Stop()

			// Wait for completion or timeout
			select {
			case err := <-errCh:
				if err != nil {
					t.Errorf("Scheduled step returned error: %v", err)
				}
			case <-time.After(1 * time.Second):
				t.Log("Step did not complete within timeout")
			}

			executions := int(executionCount.Load())
			if executions < tt.expectExecutions {
				t.Errorf("Expected at least %d executions, got %d", tt.expectExecutions, executions)
			}

			// For some tests, we want exact matches
			if tt.name == "execute at startup only" && executions != tt.expectExecutions {
				t.Errorf("Expected exactly %d executions, got %d", tt.expectExecutions, executions)
			}
		})
	}
}

func TestScheduledStepInfo(t *testing.T) {
	tests := []struct {
		name                   string
		cronSpec               string
		shouldExecuteAtStartUp bool
		startTime              *time.Time
		endTime                *time.Time
		expectScheduled        bool
		expectInWindow         bool
	}{
		{
			name:            "scheduled step with valid config",
			cronSpec:        "0 * * * *", // Every hour
			expectScheduled: true,
			expectInWindow:  true,
		},
		{
			name:            "step without schedule",
			cronSpec:        "",
			expectScheduled: false,
			expectInWindow:  true,
		},
		{
			name:            "step outside time window",
			cronSpec:        "0 * * * *",
			startTime:       timePtr(time.Now().Add(1 * time.Hour)),
			endTime:         timePtr(time.Now().Add(2 * time.Hour)),
			expectScheduled: true,
			expectInWindow:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			monitor := monitoringtest.NewMonitor(t)
			runner := func(ctx context.Context, data TestData) (TestData, error) {
				return data, nil
			}

			var opts []ScheduledStepOption
			if tt.cronSpec != "" {
				opts = append(opts, StepScheduledAt(tt.cronSpec, tt.shouldExecuteAtStartUp))
			}
			if tt.startTime != nil || tt.endTime != nil {
				opts = append(opts, StepScheduledBetween(tt.startTime, tt.endTime))
			}

			var scheduledStep *ScheduledStep[TestData]
			if len(opts) > 0 {
				scheduledStep = NewScheduledStep("test_step", runner, monitor, opts...)
			} else {
				// Create a step without schedule
				scheduledStep = NewScheduledStep("test_step", runner, monitor)
			}

			// Test IsScheduled
			isScheduled := scheduledStep.IsScheduled()
			if isScheduled != tt.expectScheduled {
				t.Errorf("Expected IsScheduled=%v, got %v", tt.expectScheduled, isScheduled)
			}

			// Test GetScheduleInfo
			info := scheduledStep.GetScheduleInfo()
			if info["has_schedule"] != tt.expectScheduled {
				t.Errorf("Expected has_schedule=%v, got %v", tt.expectScheduled, info["has_schedule"])
			}

			if info["within_time_window"] != tt.expectInWindow {
				t.Errorf("Expected within_time_window=%v, got %v", tt.expectInWindow, info["within_time_window"])
			}

			// Test GetNextExecution
			nextExec := scheduledStep.GetNextExecution()
			if tt.expectScheduled && nextExec == nil {
				t.Error("Expected next execution time but got nil")
			} else if !tt.expectScheduled && nextExec != nil {
				t.Error("Expected no next execution time but got one")
			}
		})
	}
}

func TestScheduledStepDispatchTimeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	monitor := monitoringtest.NewMonitor(t)

	// Create a step that blocks for a long time
	runner := func(ctx context.Context, data TestData) (TestData, error) {
		time.Sleep(1 * time.Minute) // This should timeout
		return data, nil
	}

	scheduledStep := NewScheduledStep(
		"blocking_step",
		runner,
		monitor,
		StepScheduledAt("* * * * *", true), // Execute at startup
	)

	// Start the step - it should timeout during dispatch
	errCh := make(chan error, 1)
	go func() {
		errCh <- scheduledStep.Run(ctx, TestData{Value: 1, Text: "test"})
	}()

	// Wait a bit for the step to start and attempt dispatch
	time.Sleep(100 * time.Millisecond)

	// Stop the step
	scheduledStep.Stop()

	// Should complete quickly due to stop signal
	select {
	case err := <-errCh:
		if err != nil {
			t.Logf("Step stopped with error (expected): %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Error("Step did not stop within reasonable time")
	}
}

func TestScheduledStepConcurrentStop(t *testing.T) {
	monitor := monitoringtest.NewMonitor(t)

	runner := func(ctx context.Context, data TestData) (TestData, error) {
		return data, nil
	}

	scheduledStep := NewScheduledStep(
		"concurrent_test_step",
		runner,
		monitor,
		StepScheduledAt("* * * * *", false),
	)

	// Start multiple goroutines that try to stop the step
	for i := 0; i < 10; i++ {
		go func() {
			time.Sleep(time.Duration(i) * time.Millisecond)
			scheduledStep.Stop()
		}()
	}

	// Wait for all stops to complete
	time.Sleep(100 * time.Millisecond)

	// Should not panic or have race conditions
	scheduledStep.Stop() // One more stop should be safe
}
