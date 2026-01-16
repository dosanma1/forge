package tcp

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrSessionClosed = errors.New("session closed")
)

// Session represents a connected client
type Session interface {
	ID() uuid.UUID
	RemoteAddr() net.Addr
	Send(data []byte) error
	Close() error
	// Context returns the session context
	Context() context.Context
	// SetContext sets the session context
	SetContext(ctx context.Context)
}

type session struct {
	id   uuid.UUID
	conn net.Conn
	ctx  context.Context

	writeTimeout time.Duration

	sendCh chan []byte
	doneCh chan struct{}

	mu     sync.RWMutex
	closed bool
}

func newSession(conn net.Conn, writeBufferSize int, writeTimeout time.Duration) *session {
	return &session{
		id:           uuid.New(),
		conn:         conn,
		ctx:          context.Background(),
		writeTimeout: writeTimeout,
		sendCh:       make(chan []byte, writeBufferSize),
		doneCh:       make(chan struct{}),
	}
}

func (s *session) Start() {
	go s.writeLoop()
}

func (s *session) ID() uuid.UUID {
	return s.id
}

func (s *session) RemoteAddr() net.Addr {
	return s.conn.RemoteAddr()
}

func (s *session) Send(data []byte) error {
	if len(data) >= 4 {
		size := binary.LittleEndian.Uint16(data[0:2])
		opcode := binary.LittleEndian.Uint16(data[2:4])
		fmt.Printf("[TCP-SEND] Session %s sending Size=%d Opcode=0x%X Len=%d\n", s.id, size, opcode, len(data))
	} else {
		fmt.Printf("[TCP-SEND] Session %s sending SMALL PACKET Len=%d\n", s.id, len(data))
	}

	s.mu.RLock()
	if s.closed {
		s.mu.RUnlock()
		return ErrSessionClosed
	}
	s.mu.RUnlock()

	select {
	case s.sendCh <- data:
		return nil
	case <-s.doneCh:
		return ErrSessionClosed
	}
}

func (s *session) Close() error {
	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return nil
	}
	s.closed = true
	close(s.doneCh)
	s.mu.Unlock()

	return s.conn.Close()
}

func (s *session) Context() context.Context {
	return s.ctx
}

func (s *session) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *session) writeLoop() {
	for {
		select {
		case data := <-s.sendCh:
			if s.writeTimeout > 0 {
				s.conn.SetWriteDeadline(time.Now().Add(s.writeTimeout))
			}

			if _, err := s.conn.Write(data); err != nil {
				s.Close()
				return
			}

		case <-s.doneCh:
			return
		}
	}
}
