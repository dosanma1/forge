package udp

import (
	"context"
	"net"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
)

// Server represents a UDP server
type Server struct {
	addrStr string
	conn    *net.UDPConn
	handler Handler
	monitor monitoring.Monitor

	sessions sync.Map // map[string]*session (key: remoteAddr.String())

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup

	// Options
	readBufferSize int
}

// NewServer creates a new UDP Server
func NewServer(addr string, handler Handler, monitor monitoring.Monitor) (*Server, error) {
	return &Server{
		addrStr:        addr,
		handler:        handler,
		monitor:        monitor,
		readBufferSize: 4096,
	}, nil
}

// Start starts the UDP listener
func (s *Server) Start() error {
	addr, err := net.ResolveUDPAddr("udp", s.addrStr)
	if err != nil {
		return err
	}

	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return err
	}

	s.conn = conn
	s.ctx, s.cancel = context.WithCancel(context.Background())

	s.monitor.Logger().Info("UDP server started", "address", addr.String())

	s.wg.Add(2)
	go s.readLoop()
	go s.resendLoop()

	return nil
}

// Stop stops the server
func (s *Server) Stop() error {
	if s.cancel != nil {
		s.cancel()
	}
	if s.conn != nil {
		s.conn.Close()
	}
	s.wg.Wait()
	return nil
}

func (s *Server) readLoop() {
	defer s.wg.Done()

	buf := make([]byte, s.readBufferSize)

	for {
		select {
		case <-s.ctx.Done():
			return
		default:
			// ReadFromUDP
			n, remoteAddr, err := s.conn.ReadFromUDP(buf)
			if err != nil {
				// Check if closed
				select {
				case <-s.ctx.Done():
					return
				default:
					s.monitor.Logger().Error("udp read error", "error", err)
					continue
				}
			}

			// Copy data to avoid buffer overwrite
			data := make([]byte, n)
			copy(data, buf[:n])

			// Decode Packet
			pkt, err := Unmarshal(data)
			if err != nil {
				// Malformed packet
				continue
			}

			// Get/Create Session
			sess := s.getSession(remoteAddr)

			// Process Reliability (Update ACKs, etc)
			if err := sess.ProcessPacket(pkt); err != nil {
				continue
			}

			// If it's pure data (Unreliable or Reliable), dispatch to Handler
			if len(pkt.Payload) > 0 {
				go func() {
					if err := s.handler.Handle(sess.Context(), sess, pkt.Payload); err != nil {
						s.monitor.Logger().Error("udp handle error", "error", err)
					}
				}()
			}
		}
	}
}

func (s *Server) resendLoop() {
	defer s.wg.Done()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			s.sessions.Range(func(key, value interface{}) bool {
				sess := value.(*session)
				sess.CheckResends()
				return true
			})
		}
	}
}

func (s *Server) getSession(addr *net.UDPAddr) *session {
	key := addr.String()
	if val, ok := s.sessions.Load(key); ok {
		return val.(*session)
	}

	// Create new session
	sess := newSession(s.ctx, s, addr)
	s.sessions.Store(key, sess)

	// Hook: OnConnect? (For now just log)
	s.monitor.Logger().Debug("UDP Session created", "addr", key)

	return sess
}

func (s *Server) writeTo(data []byte, addr *net.UDPAddr) error {
	s.monitor.Logger().Debug("UDP Write", "dest", addr.String(), "len", len(data))
	_, err := s.conn.WriteToUDP(data, addr)
	return err
}
