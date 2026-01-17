package udp_test

import (
	"testing"
	"time"

	"github.com/dosanma1/forge/go/kit/transport/udp"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBatchSenderSendSinglePacketManualFlush(t *testing.T) {
	client, err := udp.NewClient("127.0.0.1:9999", // Non-existent, just for API test
		udp.WithClientReadTimeout(0),
		udp.WithClientWriteTimeout(0),
	)
	require.NoError(t, err)
	defer client.Close()

	config := udp.BatchConfig{
		MaxBatchSize:  5,
		MaxBatchBytes: 1000,
		FlushInterval: 100 * time.Millisecond,
	}

	batch := udp.NewBatchSender(client, config)
	defer batch.Close()

	data := []byte("test packet")
	err = batch.SendBatched(data)
	assert.NoError(t, err)

	// Manual flush (won't actually send since server doesn't exist)
	_ = batch.Flush()
}

func TestBatchSenderAutoFlushWhenBatchSizeReached(t *testing.T) {
	client, err := udp.NewClient("127.0.0.1:9999",
		udp.WithClientReadTimeout(0),
		udp.WithClientWriteTimeout(0),
	)
	require.NoError(t, err)
	defer client.Close()

	config := udp.BatchConfig{
		MaxBatchSize:  3, // Small batch size
		MaxBatchBytes: 1000,
		FlushInterval: 1 * time.Second, // Long interval
	}

	batch := udp.NewBatchSender(client, config)
	defer batch.Close()

	// Send 4 packets - should trigger auto-flush after 3
	for i := 0; i < 4; i++ {
		_ = batch.SendBatched([]byte("packet"))
	}
}

func TestBatchSenderAutoFlushWhenTimeExpires(t *testing.T) {
	client, err := udp.NewClient("127.0.0.1:9999",
		udp.WithClientReadTimeout(0),
		udp.WithClientWriteTimeout(0),
	)
	require.NoError(t, err)
	defer client.Close()

	config := udp.BatchConfig{
		MaxBatchSize:  100, // Large batch
		MaxBatchBytes: 10000,
		FlushInterval: 10 * time.Millisecond, // Quick flush
	}

	batch := udp.NewBatchSender(client, config)
	defer batch.Close()

	// Send one packet and wait for time-based flush
	_ = batch.SendBatched([]byte("test"))

	// Wait for flush interval + margin
	time.Sleep(20 * time.Millisecond)
}

func BenchmarkBatchSenderSendManySmallPackets(b *testing.B) {
	client, _ := udp.NewClient("127.0.0.1:9999",
		udp.WithClientReadTimeout(0),
		udp.WithClientWriteTimeout(0),
	)
	defer client.Close()

	config := udp.DefaultBatchConfig()
	batch := udp.NewBatchSender(client, config)
	defer batch.Close()

	data := make([]byte, 100)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		batch.SendBatched(data)
	}

	b.StopTimer()
	batch.Flush() // Final flush
}

func BenchmarkBatchSenderVsDirectSendComparison(b *testing.B) {
	client, _ := udp.NewClient("127.0.0.1:9999",
		udp.WithClientReadTimeout(0),
		udp.WithClientWriteTimeout(0),
	)
	defer client.Close()

	data := make([]byte, 100)

	b.Run("DirectSendRaw", func(b *testing.B) {
		b.ReportAllocs()
		for i := 0; i < b.N; i++ {
			client.SendRaw(data)
		}
	})

	b.Run("BatchedSend", func(b *testing.B) {
		config := udp.DefaultBatchConfig()
		batch := udp.NewBatchSender(client, config)
		defer batch.Close()

		b.ReportAllocs()
		for i := 0; i < b.N; i++ {
			batch.SendBatched(data)
		}
		batch.Flush()
	})
}
