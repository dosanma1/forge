package tcp

import (
	"context"
	"errors"
	"net"
	"sync"
	"sync/atomic"
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
	closed atomic.Bool // Lock-free closed flag
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
	if s.closed.Load() {
		return ErrSessionClosed
	}

	select {
	case s.sendCh <- data:
		return nil
	case <-s.doneCh:
		return ErrSessionClosed
	}
}

func (s *session) Close() error {
	if s.closed.Swap(true) {
		// Already closed
		return nil
	}
	close(s.doneCh)
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
