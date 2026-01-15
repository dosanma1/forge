package workflow

import (
	"time"
)

// TestData represents test data for workflows
type TestData struct {
	Value int
	Text  string
}

// timePtr is a helper function to create time pointers
func timePtr(t time.Time) *time.Time {
	return &t
}
