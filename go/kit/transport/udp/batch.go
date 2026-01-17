package udp

import (
	"sync"
	"sync/atomic"
	"time"
)

// BatchConfig configures batching behavior
type BatchConfig struct {
	MaxBatchSize  int           // Max packets to batch together
	MaxBatchBytes int           // Max bytes per batch
	FlushInterval time.Duration // Force flush after this duration
}

// DefaultBatchConfig returns sensible defaults for game traffic
func DefaultBatchConfig() BatchConfig {
	return BatchConfig{
		MaxBatchSize:  10,                   // Up to 10 packets
		MaxBatchBytes: 1200,                 // Stay under MTU (1500)
		FlushInterval: 5 * time.Millisecond, // 5ms max latency
	}
}

// BatchSender handles packet batching to reduce syscall overhead
type BatchSender struct {
	client *Client
	config BatchConfig

	mu        sync.Mutex
	batch     [][]byte
	bytes     int
	lastFlush atomic.Int64 // Unix nano timestamp

	done chan struct{}
	wg   sync.WaitGroup
}

// NewBatchSender creates a batch sender wrapping a client
func NewBatchSender(client *Client, config BatchConfig) *BatchSender {
	bs := &BatchSender{
		client: client,
		config: config,
		batch:  make([][]byte, 0, config.MaxBatchSize),
		done:   make(chan struct{}),
	}

	bs.lastFlush.Store(time.Now().UnixNano())

	// Start flush goroutine
	bs.wg.Add(1)
	go bs.flushLoop()

	return bs
}

// SendBatched adds data to batch, may flush immediately if batch is full
func (bs *BatchSender) SendBatched(data []byte) error {
	bs.mu.Lock()
	defer bs.mu.Unlock()

	// Check if adding this would exceed limits
	dataLen := len(data)
	if len(bs.batch) >= bs.config.MaxBatchSize ||
		bs.bytes+dataLen > bs.config.MaxBatchBytes {
		// Flush current batch first
		if err := bs.flushLocked(); err != nil {
			return err
		}
	}

	// Add to batch
	// Copy data to avoid aliasing issues
	dataCopy := make([]byte, dataLen)
	copy(dataCopy, data)
	bs.batch = append(bs.batch, dataCopy)
	bs.bytes += dataLen

	return nil
}

// Flush sends all batched packets immediately
func (bs *BatchSender) Flush() error {
	bs.mu.Lock()
	defer bs.mu.Unlock()
	return bs.flushLocked()
}

// flushLocked sends batched packets (caller must hold lock)
func (bs *BatchSender) flushLocked() error {
	if len(bs.batch) == 0 {
		return nil
	}

	// Combine all packets into one
	combined := make([]byte, bs.bytes)
	offset := 0
	for _, pkt := range bs.batch {
		copy(combined[offset:], pkt)
		offset += len(pkt)
	}

	// Send combined packet
	err := bs.client.SendRaw(combined)

	// Reset batch
	bs.batch = bs.batch[:0]
	bs.bytes = 0
	bs.lastFlush.Store(time.Now().UnixNano())

	return err
}

// flushLoop periodically flushes based on time
func (bs *BatchSender) flushLoop() {
	defer bs.wg.Done()

	ticker := time.NewTicker(bs.config.FlushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			bs.mu.Lock()
			// Only flush if we have data and haven't flushed recently
			if len(bs.batch) > 0 {
				lastFlush := time.Unix(0, bs.lastFlush.Load())
				if time.Since(lastFlush) >= bs.config.FlushInterval {
					bs.flushLocked()
				}
			}
			bs.mu.Unlock()

		case <-bs.done:
			// Final flush before exit
			bs.mu.Lock()
			bs.flushLocked()
			bs.mu.Unlock()
			return
		}
	}
}

// Close stops the batch sender and flushes remaining data
func (bs *BatchSender) Close() error {
	close(bs.done)
	bs.wg.Wait()
	return nil
}
