package udp

import (
	"context"
	"fmt"
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

	Send(data []byte) error         // Unreliable
	SendReliable(data []byte) error // Reliable (Seq+Ack)

	// Internal methods called by Server
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

func (s *session) Send(data []byte) error {
	// Unreliable: Just wrap and send
	p := Packet{
		Type:    PacketTypeUnreliable,
		Seq:     0, // Unreliable doesn't track Seq for ordering usually, or could use separate counter
		Ack:     0,
		Payload: data,
	}
	// We can set Ack to last received to help reliability on other side
	s.mu.Lock()
	p.Ack = s.lastAckRecv
	s.mu.Unlock()

	return s.server.writeTo(p.Marshal(), s.remoteAddr)
}

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

func (s *session) ProcessPacket(p Packet) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Handle ACKs
	if p.Ack > 0 {
		s.handleAck(p.Ack)
	}

	// 2. Handle Payload
	// For Reliable packets, we should check Order. (Simpler implementation: Allow gaps for now or Drop dups)
	// Since we are "Basic Foundation": We assume unreliable is mostly used.
	// If it is Reliable, we update lastAckRecv.
	if p.Type == PacketTypeReliable {
		// Update Ack state
		if p.Seq > s.lastAckRecv {
			s.lastAckRecv = p.Seq
		}
		// Send immediate ACK? Or piggyback?
		// For foundation, let's send explicit ACK if we have no data to send.
		s.sendAck(p.Seq)
	}

	return nil
}

func (s *session) handleAck(ackSeq uint16) {
	// Remove acknowledged packets from queue
	// We assume cumulative ACK or individual?
	// Let's assume this Ack confirms THIS packet. Simpler.

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
				fmt.Printf("UDP Session %s dropped packet %d after max retries\n", s.id, pkt.seq)
				// Remove? Or keep trying?
				// For now, let's just log and reset timer to avoid spam.
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
