package udp

import (
	"sync"
	"time"
)

// MessagePriority defines the urgency level of a network message
type MessagePriority uint8

const (
	// PRIORITY_LOW for high-frequency, non-critical updates (movement heartbeats, particles)
	PRIORITY_LOW MessagePriority = 0
	// PRIORITY_NORMAL for standard gameplay traffic (movement state changes)
	PRIORITY_NORMAL MessagePriority = 1
	// PRIORITY_HIGH for important gameplay events (abilities, damage)
	PRIORITY_HIGH MessagePriority = 2
	// PRIORITY_CRITICAL for game-critical events (deaths, disconnects)
	PRIORITY_CRITICAL MessagePriority = 3
)

// PriorityMessage represents a queued message with metadata
type PriorityMessage struct {
	Data      []byte
	Priority  MessagePriority
	Timestamp time.Time
	Session   Session // Direct session reference for sending
}

// PriorityQueue manages multiple message queues by priority level
// Higher priority messages are dequeued first (CRITICAL > HIGH > NORMAL > LOW)
type PriorityQueue struct {
	queues [4][]PriorityMessage // One queue per priority level
	mu     sync.Mutex
	cond   *sync.Cond
}

// NewPriorityQueue creates a new priority-based message queue
func NewPriorityQueue() *PriorityQueue {
	pq := &PriorityQueue{}
	pq.cond = sync.NewCond(&pq.mu)
	return pq
}

// Enqueue adds a message to the appropriate priority queue
func (pq *PriorityQueue) Enqueue(data []byte, session Session, priority MessagePriority) {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	pq.queues[priority] = append(pq.queues[priority], PriorityMessage{
		Data:      data,
		Priority:  priority,
		Timestamp: time.Now(),
		Session:   session,
	})

	// Signal waiting workers
	pq.cond.Signal()
}

// Dequeue removes and returns the highest priority message
// Returns false if all queues are empty
func (pq *PriorityQueue) Dequeue() (PriorityMessage, bool) {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	// Dequeue from highest priority first (3 → 0)
	for i := 3; i >= 0; i-- {
		if len(pq.queues[i]) > 0 {
			msg := pq.queues[i][0]
			pq.queues[i] = pq.queues[i][1:]
			return msg, true
		}
	}

	return PriorityMessage{}, false
}

// DequeueBlocking waits for a message to become available
func (pq *PriorityQueue) DequeueBlocking() PriorityMessage {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	for {
		// Try to dequeue from highest priority first
		for i := 3; i >= 0; i-- {
			if len(pq.queues[i]) > 0 {
				msg := pq.queues[i][0]
				pq.queues[i] = pq.queues[i][1:]
				return msg
			}
		}

		// Wait for signal
		pq.cond.Wait()
	}
}

// Len returns the total number of queued messages across all priorities
func (pq *PriorityQueue) Len() int {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	total := 0
	for i := 0; i < 4; i++ {
		total += len(pq.queues[i])
	}
	return total
}

// LenByPriority returns the number of messages at a specific priority
func (pq *PriorityQueue) LenByPriority(priority MessagePriority) int {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	if priority > PRIORITY_CRITICAL {
		return 0
	}
	return len(pq.queues[priority])
}

// Stats returns queue statistics for monitoring
type QueueStats struct {
	TotalQueued      int
	LowQueued        int
	NormalQueued     int
	HighQueued       int
	CriticalQueued   int
	OldestMessageAge time.Duration
}

// GetStats returns current queue statistics
func (pq *PriorityQueue) GetStats() QueueStats {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	stats := QueueStats{
		LowQueued:      len(pq.queues[PRIORITY_LOW]),
		NormalQueued:   len(pq.queues[PRIORITY_NORMAL]),
		HighQueued:     len(pq.queues[PRIORITY_HIGH]),
		CriticalQueued: len(pq.queues[PRIORITY_CRITICAL]),
	}

	stats.TotalQueued = stats.LowQueued + stats.NormalQueued + stats.HighQueued + stats.CriticalQueued

	// Find oldest message
	var oldest time.Time
	for i := 0; i < 4; i++ {
		if len(pq.queues[i]) > 0 {
			if oldest.IsZero() || pq.queues[i][0].Timestamp.Before(oldest) {
				oldest = pq.queues[i][0].Timestamp
			}
		}
	}

	if !oldest.IsZero() {
		stats.OldestMessageAge = time.Since(oldest)
	}

	return stats
}
