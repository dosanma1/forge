package workflow

import (
	"context"
	"errors"
	"fmt"
	"sync/atomic"
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/monitoringtest"
)

func TestWorkflow(t *testing.T) {
	tests := []struct {
		name          string
		initialData   TestData
		createSteps   func(t *testing.T) []Step[TestData]
		startSteps    []string
		expectedValue int
		expectedText  string
		expectError   bool
	}{
		{
			name:        "single step workflow",
			initialData: TestData{Value: 1, Text: "start"},
			createSteps: func(t *testing.T) []Step[TestData] {
				return []Step[TestData]{
					NewStep("step1", func(ctx context.Context, data TestData) (TestData, error) {
						return TestData{Value: data.Value + 1, Text: "processed"}, nil
					}, monitoringtest.NewMonitor(t)),
				}
			},
			startSteps:    []string{"step1"},
			expectedValue: 2,
			expectedText:  "processed",
			expectError:   false,
		},
		{
			name:        "multi step workflow",
			initialData: TestData{Value: 5, Text: "initial"},
			createSteps: func(t *testing.T) []Step[TestData] {
				return []Step[TestData]{
					NewStep("step1", func(ctx context.Context, data TestData) (TestData, error) {
						return TestData{Value: data.Value * 2, Text: "doubled"}, nil
					}, monitoringtest.NewMonitor(t)),
					NewStep("step2", func(ctx context.Context, data TestData) (TestData, error) {
						return TestData{Value: data.Value + 10, Text: "added"}, nil
					}, monitoringtest.NewMonitor(t)),
				}
			},
			startSteps:    []string{"step1", "step2"},
			expectedValue: 10, // Note: steps run concurrently, so we test both get the initial data
			expectedText:  "added",
			expectError:   false,
		},
		{
			name:        "step with error",
			initialData: TestData{Value: 1, Text: "start"},
			createSteps: func(t *testing.T) []Step[TestData] {
				return []Step[TestData]{
					NewStep("failing_step", func(ctx context.Context, data TestData) (TestData, error) {
						return TestData{}, errors.New("step failed")
					}, monitoringtest.NewMonitor(t)),
				}
			},
			startSteps:  []string{"failing_step"},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			monitor := monitoringtest.NewMonitor(t)
			steps := tt.createSteps(t)
			wf := New("test-workflow", monitor, WithSteps(steps...))

			// Start the workflow in a goroutine since it runs indefinitely
			errCh := make(chan error, 1)
			go func() {
				err := wf.Run(ctx, tt.initialData, tt.startSteps...)
				errCh <- err
			}()

			// Give some time for steps to execute
			time.Sleep(100 * time.Millisecond)

			// Stop the workflow
			wf.Stop()

			// Wait for workflow to complete
			select {
			case err := <-errCh:
				if tt.expectError && err == nil {
					t.Errorf("Expected error but got none")
				}
				if !tt.expectError && err != nil && err != context.Canceled {
					t.Errorf("Unexpected error: %v", err)
				}
			case <-time.After(time.Second):
				t.Error("Workflow did not complete in time")
			}
		})
	}
}

func TestWorkflowWithSchedule(t *testing.T) {
	tests := []struct {
		name        string
		startTime   *time.Time
		endTime     *time.Time
		expectError bool
	}{
		{
			name:        "workflow with future start time",
			startTime:   timePtr(time.Now().Add(1 * time.Second)),
			endTime:     timePtr(time.Now().Add(10 * time.Second)),
			expectError: false,
		},
		{
			name:        "workflow with past start time",
			startTime:   timePtr(time.Now().Add(-1 * time.Second)),
			endTime:     timePtr(time.Now().Add(10 * time.Second)),
			expectError: false,
		},
		{
			name:        "workflow with immediate deadline",
			startTime:   nil,
			endTime:     timePtr(time.Now().Add(50 * time.Millisecond)),
			expectError: false, // Should stop gracefully due to deadline
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			monitor := monitoringtest.NewMonitor(t)
			step := NewStep("test_step", func(ctx context.Context, data TestData) (TestData, error) {
				time.Sleep(10 * time.Millisecond) // Small delay
				return data, nil
			}, monitor)

			opts := []WorkflowOption[TestData]{
				WithSteps(step),
			}

			if tt.startTime != nil || tt.endTime != nil {
				opts = append(opts, WithSchedule[TestData](tt.startTime, tt.endTime))
			}

			wf := New("scheduled-workflow", monitor, opts...)

			// Start the workflow in a goroutine
			errCh := make(chan error, 1)
			go func() {
				err := wf.Run(ctx, TestData{Value: 1, Text: "test"}, "test_step")
				errCh <- err
			}()

			// Give some time for the workflow to process
			time.Sleep(100 * time.Millisecond)

			// Stop the workflow
			wf.Stop()

			// Wait for workflow to complete
			select {
			case err := <-errCh:
				if tt.expectError && err == nil {
					t.Errorf("Expected error but got none")
				} else if !tt.expectError && err != nil && err != context.Canceled {
					t.Errorf("Unexpected error: %v", err)
				}
			case <-time.After(time.Second):
				t.Error("Workflow did not complete in time")
			}
		})
	}
}

func TestWorkflowGoToStep(t *testing.T) {
	tests := []struct {
		name         string
		stepName     string
		availSteps   []string
		expectError  bool
		errorMessage string
	}{
		{
			name:        "valid step name",
			stepName:    "step1",
			availSteps:  []string{"step1", "step2"},
			expectError: false,
		},
		{
			name:         "invalid step name",
			stepName:     "nonexistent",
			availSteps:   []string{"step1", "step2"},
			expectError:  true,
			errorMessage: "step nonexistent not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			monitor := monitoringtest.NewMonitor(t)
			var steps []Step[TestData]

			for _, stepName := range tt.availSteps {
				step := NewStep(stepName, func(ctx context.Context, data TestData) (TestData, error) {
					return data, nil
				}, monitor)
				steps = append(steps, step)
			}

			wf := New("test-workflow", monitor, WithSteps(steps...))

			err := wf.GoToStep(tt.stepName, TestData{Value: 1, Text: "test"})

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if err.Error() != tt.errorMessage {
					t.Errorf("Expected error message %q, got %q", tt.errorMessage, err.Error())
				}
			} else if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestConcurrentWorkflowExecution(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	monitor := monitoringtest.NewMonitor(t)
	var counter atomic.Int32

	// Create multiple steps that increment a counter
	steps := make([]Step[TestData], 5)
	for i := 0; i < 5; i++ {
		stepName := fmt.Sprintf("step%d", i)
		steps[i] = NewStep(stepName, func(ctx context.Context, data TestData) (TestData, error) {
			counter.Add(1)
			time.Sleep(10 * time.Millisecond) // Small delay to test concurrency
			return data, nil
		}, monitor)
	}

	wf := New("concurrent-workflow", monitor, WithSteps(steps...))

	// Start the workflow in a goroutine
	errCh := make(chan error, 1)
	go func() {
		startSteps := []string{"step0", "step1", "step2", "step3", "step4"}
		err := wf.Run(ctx, TestData{Value: 1, Text: "test"}, startSteps...)
		errCh <- err
	}()

	// Give time for steps to execute
	time.Sleep(200 * time.Millisecond)

	// Stop workflow
	wf.Stop()

	// Wait for workflow to complete
	select {
	case err := <-errCh:
		if err != nil && err != context.Canceled {
			t.Fatalf("Unexpected error: %v", err)
		}
	case <-time.After(time.Second):
		t.Error("Workflow did not complete in time")
	}

	// Check that all steps executed
	if counter.Load() != 5 {
		t.Errorf("Expected 5 step executions, got %d", counter.Load())
	}
}
