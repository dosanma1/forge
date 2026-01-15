package workflow

import (
	"context"
	"time"
)

// waitUntil waits until the specified time or until the context is cancelled
func waitUntil(ctx context.Context, until time.Time) error {
	duration := time.Until(until)
	if duration > 0 {
		select {
		case <-time.After(duration):
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}
