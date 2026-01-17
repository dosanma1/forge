package udp

import (
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPriorityQueueEnqueueDequeue(t *testing.T) {
	pq := NewPriorityQueue()

	// Enqueue messages at different priorities
	pq.Enqueue([]byte("low"), nil, PRIORITY_LOW)
	pq.Enqueue([]byte("normal"), nil, PRIORITY_NORMAL)
	pq.Enqueue([]byte("high"), nil, PRIORITY_HIGH)
	pq.Enqueue([]byte("critical"), nil, PRIORITY_CRITICAL)

	// Dequeue should return in priority order (critical first)
	msg, ok := pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("critical"), msg.Data)

	msg, ok = pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("high"), msg.Data)

	msg, ok = pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("normal"), msg.Data)

	msg, ok = pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("low"), msg.Data)

	// Queue should be empty
	_, ok = pq.Dequeue()
	assert.False(t, ok)
}

func TestPriorityQueueMultipleSamePriority(t *testing.T) {
	pq := NewPriorityQueue()

	// Enqueue multiple high-priority messages
	pq.Enqueue([]byte("high1"), nil, PRIORITY_HIGH)
	pq.Enqueue([]byte("high2"), nil, PRIORITY_HIGH)
	pq.Enqueue([]byte("high3"), nil, PRIORITY_HIGH)

	// Should dequeue in FIFO order within same priority
	msg, ok := pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("high1"), msg.Data)

	msg, ok = pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("high2"), msg.Data)

	msg, ok = pq.Dequeue()
	assert.True(t, ok)
	assert.Equal(t, []byte("high3"), msg.Data)
}

func TestPriorityQueueLen(t *testing.T) {
	pq := NewPriorityQueue()

	assert.Equal(t, 0, pq.Len())

	pq.Enqueue([]byte("msg1"), nil, PRIORITY_LOW)
	assert.Equal(t, 1, pq.Len())

	pq.Enqueue([]byte("msg2"), nil, PRIORITY_HIGH)
	assert.Equal(t, 2, pq.Len())

	pq.Dequeue()
	assert.Equal(t, 1, pq.Len())

	pq.Dequeue()
	assert.Equal(t, 0, pq.Len())
}

func TestPriorityQueueLenByPriority(t *testing.T) {
	pq := NewPriorityQueue()

	pq.Enqueue([]byte("low1"), nil, PRIORITY_LOW)
	pq.Enqueue([]byte("low2"), nil, PRIORITY_LOW)
	pq.Enqueue([]byte("high1"), nil, PRIORITY_HIGH)

	assert.Equal(t, 2, pq.LenByPriority(PRIORITY_LOW))
	assert.Equal(t, 0, pq.LenByPriority(PRIORITY_NORMAL))
	assert.Equal(t, 1, pq.LenByPriority(PRIORITY_HIGH))
	assert.Equal(t, 0, pq.LenByPriority(PRIORITY_CRITICAL))
}

func TestPriorityQueueStats(t *testing.T) {
	pq := NewPriorityQueue()

	// Empty queue stats
	stats := pq.GetStats()
	assert.Equal(t, 0, stats.TotalQueued)
	assert.Equal(t, time.Duration(0), stats.OldestMessageAge)

	// Add messages
	pq.Enqueue([]byte("low"), nil, PRIORITY_LOW)
	time.Sleep(10 * time.Millisecond) // Ensure timestamp difference
	pq.Enqueue([]byte("high"), nil, PRIORITY_HIGH)

	stats = pq.GetStats()
	assert.Equal(t, 2, stats.TotalQueued)
	assert.Equal(t, 1, stats.LowQueued)
	assert.Equal(t, 1, stats.HighQueued)
	assert.Greater(t, stats.OldestMessageAge, 10*time.Millisecond)
}

func TestPriorityQueueDequeueBlocking(t *testing.T) {
	pq := NewPriorityQueue()

	// Start goroutine that dequeues (will block)
	done := make(chan bool)
	var result []byte

	go func() {
		msg := pq.DequeueBlocking()
		result = msg.Data
		done <- true
	}()

	// Give goroutine time to start waiting
	time.Sleep(10 * time.Millisecond)

	// Enqueue message
	pq.Enqueue([]byte("test"), nil, PRIORITY_NORMAL)

	// Wait for dequeue to complete
	select {
	case <-done:
		assert.Equal(t, []byte("test"), result)
	case <-time.After(1 * time.Second):
		t.Fatal("DequeueBlocking did not unblock")
	}
}

func TestPriorityQueueConcurrentAccess(t *testing.T) {
	pq := NewPriorityQueue()

	// Spawn multiple producers
	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				pq.Enqueue([]byte{byte(id)}, nil, PRIORITY_NORMAL)
			}
		}(i)
	}

	// Spawn multiple consumers
	var consumed int32
	done := make(chan bool)

	for i := 0; i < 5; i++ {
		go func() {
			for {
				_, ok := pq.Dequeue()
				if !ok {
					time.Sleep(1 * time.Millisecond)
					continue
				}
				newVal := atomic.AddInt32(&consumed, 1)
				if newVal >= 1000 {
					// Use non-blocking send or ensure only one signals
					// Here we just signal done and return.
					// Since multiple might hit >= 1000 if over-produced (not here)
					// or race to msg. This is a simple test condition.
					// To avoid blocking channel if multiple hit it:
					select {
					case done <- true:
					default:
					}
					return
				}
			}
		}()
	}

	// Wait for all messages to be consumed
	select {
	case <-done:
		assert.Equal(t, int32(1000), atomic.LoadInt32(&consumed))
	case <-time.After(5 * time.Second):
		t.Fatal("Concurrent test timed out")
	}
}
