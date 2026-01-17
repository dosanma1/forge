package udp

import (
	"context"
	"net"
	"os"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"
)

// OnConnectHook is a callback when a new session is established
type OnConnectHook func(context.Context, Session)

type serverConfig struct {
	addrStr        string
	handler        Handler
	onConnect      OnConnectHook
	readBufferSize int
	controllers    []Controller
	middlewares    []Middleware
}

// serverOption represents a functional option for configuring the server
type serverOption func(*serverConfig)

// defaultServerOpts returns the default options
func defaultServerOpts() []serverOption {
	return []serverOption{
		WithReadBufferSize(4096),
	}
}

// WithAddress sets the address for the server
func WithAddress(addr string) serverOption {
	return func(c *serverConfig) {
		c.addrStr = addr
	}
}

// WithAddressFromEnv sets the address from environment variable
func WithAddressFromEnv(envVar string) serverOption {
	return func(c *serverConfig) {
		if addr := os.Getenv(envVar); addr != "" {
			c.addrStr = addr
		}
	}
}

// WithHandler sets the handler for the server
func WithHandler(h Handler) serverOption {
	return func(c *serverConfig) {
		c.handler = h
	}
}

// WithControllers adds controllers to the server
func WithControllers(controllers ...Controller) serverOption {
	return func(c *serverConfig) {
		c.controllers = append(c.controllers, controllers...)
	}
}

// WithMiddlewares adds middlewares to the server
func WithMiddlewares(middlewares ...Middleware) serverOption {
	return func(c *serverConfig) {
		c.middlewares = append(c.middlewares, middlewares...)
	}
}

// WithOnConnect sets the callback for new connections
func WithOnConnect(hook OnConnectHook) serverOption {
	return func(c *serverConfig) {
		c.onConnect = hook
	}
}

// WithReadBufferSize sets the read buffer size
func WithReadBufferSize(size int) serverOption {
	return func(c *serverConfig) {
		c.readBufferSize = size
	}
}

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
	onConnect      OnConnectHook
}

// NewServer creates a new UDP Server
func NewServer(monitor monitoring.Monitor, opts ...serverOption) (*Server, error) {
	cfg := &serverConfig{}
	for _, opt := range append(defaultServerOpts(), opts...) {
		opt(cfg)
	}

	// Default Handler if none provided
	if cfg.handler == nil {
		cfg.handler = NewMux()
	}

	// Register Controllers if Handler is a Registry
	if registry, ok := cfg.handler.(Registry); ok {
		for _, c := range cfg.controllers {
			c.Register(registry)
		}
	}

	// Apply Middlewares
	h := cfg.handler
	for i := len(cfg.middlewares) - 1; i >= 0; i-- {
		h = cfg.middlewares[i](h)
	}

	s := &Server{
		addrStr:        cfg.addrStr,
		handler:        h,
		monitor:        monitor,
		readBufferSize: cfg.readBufferSize,
		onConnect:      cfg.onConnect,
	}

	// Default logging hook
	if s.onConnect == nil && s.monitor != nil {
		s.onConnect = func(ctx context.Context, sess Session) {
			s.monitor.Logger().Debug("UDP Session created", "addr", sess.RemoteAddr().String())
		}
	}

	return s, nil
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

	// Execute Hook
	if s.onConnect != nil {
		s.onConnect(s.ctx, sess)
	}

	return sess
}

func (s *Server) writeTo(data []byte, addr *net.UDPAddr) error {
	s.monitor.Logger().Debug("UDP Write", "dest", addr.String(), "len", len(data))
	_, err := s.conn.WriteToUDP(data, addr)
	return err
}
