package udp

import (
	"context"
	"net"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	// ResendTimeout is how long we wait before resending a reliable packet
	ResendTimeout = 300 * time.Millisecond
	// MaxRetries is how many times we retry before dropping/disconnecting
	MaxRetries = 5
)

// Session represents a connection-like state over UDP
type Session interface {
	ID() string
	RemoteAddr() net.Addr
	Context() context.Context

	// SendUnreliable sends data without reliability guarantees (for position updates)
	// Uses packet framing but no ACK/retry. Fast path for high-frequency updates.
	SendUnreliable(data []byte) error

	// SendReliable sends data with ACK and retry (for critical events)
	// Guaranteed delivery with retransmission on packet loss.
	SendReliable(data []byte) error

	// SendPriority sends data through priority queue (for prioritized delivery)
	// Higher priority messages are sent before lower priority ones.
	SendPriority(data []byte, priority MessagePriority) error

	// Send is an alias for SendUnreliable (backwards compatibility)
	Send(data []byte) error

	// Internal methods called by Server
	ProcessPacket(p Packet) error
	CheckResends()
	Close()
}

type session struct {
	id         string
	server     *Server
	remoteAddr *net.UDPAddr
	ctx        context.Context
	cancel     context.CancelFunc

	// Reliability State
	mu          sync.Mutex
	nextSeq     uint16
	lastAckRecv uint16 // The highest Seq we've seen from remote (to Ack back)
	sendQueue   []*pendingPacket

	// Metadata
	accountID string
}

type pendingPacket struct {
	seq      uint16
	data     []byte
	sentAt   time.Time
	attempts int
}

func newSession(ctx context.Context, server *Server, addr *net.UDPAddr) *session {
	ctx, cancel := context.WithCancel(ctx)
	return &session{
		id:         uuid.New().String(),
		server:     server,
		remoteAddr: addr,
		ctx:        ctx,
		cancel:     cancel,
		nextSeq:    1, // Start at 1
		sendQueue:  make([]*pendingPacket, 0),
	}
}

func (s *session) ID() string {
	return s.id
}

func (s *session) RemoteAddr() net.Addr {
	return s.remoteAddr
}

func (s *session) Context() context.Context {
	return s.ctx
}

// SendUnreliable sends data without reliability (packet framing, no ACK)
// Best for high-frequency position updates where newest data matters most.
func (s *session) SendUnreliable(data []byte) error {
	p := Packet{
		Type:    PacketTypeUnreliable,
		Seq:     0, // Unreliable doesn't track Seq
		Ack:     0,
		Payload: data,
	}
	// Piggyback ACK to help reliability on other side
	s.mu.Lock()
	p.Ack = s.lastAckRecv
	s.mu.Unlock()

	return s.server.writeTo(p.Marshal(), s.remoteAddr)
}

// Send is an alias for SendUnreliable for backwards compatibility
func (s *session) Send(data []byte) error {
	return s.SendUnreliable(data)
}

// SendReliable sends data with ACK and retry guarantees
// Best for critical events like combat, item pickups, state changes.
// Will retry up to MaxRetries times with ResendTimeout delay.
func (s *session) SendReliable(data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	seq := s.nextSeq
	s.nextSeq++

	p := Packet{
		Type:    PacketTypeReliable,
		Seq:     seq,
		Ack:     s.lastAckRecv,
		Payload: data,
	}

	bytes := p.Marshal()

	// Store for retransmission
	s.sendQueue = append(s.sendQueue, &pendingPacket{
		seq:      seq,
		data:     bytes,
		sentAt:   time.Now(),
		attempts: 1,
	})

	return s.server.writeTo(bytes, s.remoteAddr)
}

// SendPriority enqueues data to the priority queue for ordered delivery
// Higher priority messages are sent before lower priority ones.
// Use this when you need both reliability and priority ordering.
func (s *session) SendPriority(data []byte, priority MessagePriority) error {
	// For now, delegate to server's priority queue if available
	// This is a placeholder - full implementation would integrate with PriorityQueue
	if priority >= PRIORITY_HIGH {
		// High priority: send reliably and immediately
		return s.SendReliable(data)
	}
	// Normal/Low priority: send unreliably (faster)
	return s.SendUnreliable(data)
}

func (s *session) ProcessPacket(p Packet) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Handle ACKs
	if p.Ack > 0 {
		s.handleAck(p.Ack)
	}

	// 2. Handle Payload
	// If it is Reliable, we update lastAckRecv.
	if p.Type == PacketTypeReliable {
		// Update Ack state
		if p.Seq > s.lastAckRecv {
			s.lastAckRecv = p.Seq
		}
		// Send immediate ACK
		s.sendAck(p.Seq)
	}

	return nil
}

func (s *session) handleAck(ackSeq uint16) {
	// Remove acknowledged packets from queue
	newQueue := make([]*pendingPacket, 0, len(s.sendQueue))
	for _, pkt := range s.sendQueue {
		if pkt.seq != ackSeq {
			newQueue = append(newQueue, pkt)
		}
	}
	s.sendQueue = newQueue
}

func (s *session) sendAck(seq uint16) {
	// Send a control ACK packet
	ackPkt := Packet{
		Type: PacketTypeAck,
		Seq:  0,
		Ack:  seq,
	}
	_ = s.server.writeTo(ackPkt.Marshal(), s.remoteAddr)
}

func (s *session) CheckResends() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for _, pkt := range s.sendQueue {
		if now.Sub(pkt.sentAt) > ResendTimeout {
			if pkt.attempts >= MaxRetries {
				// Failed. Log or Disconnect.
				s.server.monitor.Logger().
					WithKeysAndValues("id", s.id, "seq", pkt.seq).
					ErrorContext(s.ctx, "Dropped packet after max retries")
				// Reset timer to avoid spam
				pkt.sentAt = now
				continue
			}

			// Resend
			pkt.attempts++
			pkt.sentAt = now
			_ = s.server.writeTo(pkt.data, s.remoteAddr)
		}
	}
}

func (s *session) Close() {
	s.cancel()
}
