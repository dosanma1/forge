package tcp

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"sync"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring"

	"github.com/google/uuid"
)

// Server represents a TCP server
type Server struct {
	address        string
	monitor        monitoring.Monitor
	handler        Handler
	packetSplitter bufio.SplitFunc

	readTimeout     time.Duration
	writeTimeout    time.Duration
	readBufferSize  int
	writeBufferSize int
	maxConnections  int

	// Hooks
	onConnect    func(Session)
	onDisconnect func(Session)

	listener net.Listener
	mu       sync.RWMutex
	sessions map[uuid.UUID]*session
	readPool *sync.Pool

	shutdown chan struct{}
	wg       sync.WaitGroup

	controllers []Controller
	middlewares []Middleware
}

type serverConfig struct {
	packetSplitter  bufio.SplitFunc
	readBufferSize  int
	writeBufferSize int
	readTimeout     time.Duration
	writeTimeout    time.Duration
	maxConnections  int
	onConnect       func(Session)
	onDisconnect    func(Session)
	address         string
	handler         Handler
	controllers     []Controller
	middlewares     []Middleware
}

// serverOption allows configuring the server
type serverOption func(*serverConfig)

// defaultServerOpts returns the default options
func defaultServerOpts() []serverOption {
	return []serverOption{
		WithPacketSplitter(bufio.ScanLines),
		WithReadBufferSize(4096),
		WithWriteBufferSize(128),
		withAddrFromEnv(),
	}
}

// WithPacketSplitter sets the packet splitter
func WithPacketSplitter(splitter bufio.SplitFunc) serverOption {
	return func(s *serverConfig) {
		s.packetSplitter = splitter
	}
}

// WithReadTimeout sets the read timeout
func WithReadTimeout(d time.Duration) serverOption {
	return func(s *serverConfig) {
		s.readTimeout = d
	}
}

// WithWriteDuration sets the write timeout
func WithWriteDuration(d time.Duration) serverOption {
	return func(s *serverConfig) {
		s.writeTimeout = d
	}
}

// WithReadBufferSize sets the read buffer size
func WithReadBufferSize(size int) serverOption {
	return func(s *serverConfig) {
		s.readBufferSize = size
	}
}

// WithWriteBufferSize sets the write channel buffer size
func WithWriteBufferSize(size int) serverOption {
	return func(s *serverConfig) {
		s.writeBufferSize = size
	}
}

// WithMaxConnections sets the maximum number of concurrent connections
func WithMaxConnections(max int) serverOption {
	return func(s *serverConfig) {
		s.maxConnections = max
	}
}

// WithOnConnect sets the onConnect hook
func WithOnConnect(f func(Session)) serverOption {
	return func(s *serverConfig) {
		s.onConnect = f
	}
}

// WithOnDisconnect sets the onDisconnect hook
func WithOnDisconnect(f func(Session)) serverOption {
	return func(s *serverConfig) {
		s.onDisconnect = f
	}
}

// WithAddress sets the server address
func WithAddress(addr string) serverOption {
	return func(s *serverConfig) {
		s.address = addr
	}
}

// WithHandler sets the packet handler
func WithHandler(handler Handler) serverOption {
	return func(s *serverConfig) {
		s.handler = handler
	}
}

// WithControllers registers controllers with the server
func WithControllers(controllers ...Controller) serverOption {
	return func(s *serverConfig) {
		s.controllers = append(s.controllers, controllers...)
	}
}

// WithMiddlewares adds middlewares to the server
func WithMiddlewares(middlewares ...Middleware) serverOption {
	return func(s *serverConfig) {
		s.middlewares = append(s.middlewares, middlewares...)
	}
}

func withAddrFromEnv() serverOption {
	addr := os.Getenv("TCP_ADDRESS")
	if addr == "" {
		return func(s *serverConfig) {}
	}
	return WithAddress(addr)
}

// NewServer creates a new TCP server
func NewServer(monitor monitoring.Monitor, opts ...serverOption) (*Server, error) {
	cfg := &serverConfig{}
	for _, opt := range append(defaultServerOpts(), opts...) {
		opt(cfg)
	}

	s := &Server{
		monitor:         monitor,
		sessions:        make(map[uuid.UUID]*session),
		shutdown:        make(chan struct{}),
		packetSplitter:  cfg.packetSplitter,
		readBufferSize:  cfg.readBufferSize,
		writeBufferSize: cfg.writeBufferSize,
		readTimeout:     cfg.readTimeout,
		writeTimeout:    cfg.writeTimeout,
		maxConnections:  cfg.maxConnections,
		onConnect:       cfg.onConnect,
		onDisconnect:    cfg.onDisconnect,
		address:         cfg.address,
		handler:         cfg.handler,
		controllers:     cfg.controllers,
		middlewares:     cfg.middlewares,
	}

	s.readPool = &sync.Pool{
		New: func() interface{} {
			return make([]byte, s.readBufferSize)
		},
	}

	// Validate required dependencies
	if s.handler == nil {
		return nil, fmt.Errorf("TCP server requires a Handler")
	}

	// Register controllers if handler supports it
	if len(s.controllers) > 0 {
		registry, ok := s.handler.(Registry)
		if !ok {
			return nil, fmt.Errorf("TCP Controllers provided but Handler (%T) does not implement tcp.Registry", s.handler)
		}
		for _, c := range s.controllers {
			c.Register(registry)
		}
	}

	// Apply Middlewares
	h := s.handler
	for i := len(s.middlewares) - 1; i >= 0; i-- {
		h = s.middlewares[i](h)
	}
	s.handler = h

	return s, nil
}

// hooks
func (s *Server) SetOnConnect(f func(Session)) {
	s.onConnect = f
}

func (s *Server) SetOnDisconnect(f func(Session)) {
	s.onDisconnect = f
}

func (s *Server) Start() error {
	listener, err := net.Listen("tcp", s.address)
	if err != nil {
		return err
	}

	s.mu.Lock()
	s.listener = listener
	s.mu.Unlock()

	s.monitor.Logger().Info("TCP server started", "address", s.listener.Addr().String())

	s.wg.Add(1)
	go s.acceptLoop()

	return nil
}

func (s *Server) Addr() net.Addr {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.listener != nil {
		return s.listener.Addr()
	}
	return nil
}

func (s *Server) Stop() error {
	close(s.shutdown)
	if s.listener != nil {
		s.listener.Close()
	}
	s.wg.Wait()
	return nil
}

func (s *Server) acceptLoop() {
	defer s.wg.Done()

	for {
		conn, err := s.listener.Accept()
		if err != nil {
			select {
			case <-s.shutdown:
				return
			default:
				s.monitor.Logger().Error("accept error", "error", err)
				continue
			}
		}

		go s.handleConn(conn)
	}
}

func (s *Server) handleConn(conn net.Conn) {
	session := newSession(conn, s.writeBufferSize, s.writeTimeout)
	session.Start()

	s.mu.Lock()
	s.sessions[session.id] = session
	s.mu.Unlock()

	if s.onConnect != nil {
		s.onConnect(session)
	}

	defer func() {
		s.mu.Lock()
		delete(s.sessions, session.id)
		s.mu.Unlock()

		if s.onDisconnect != nil {
			s.onDisconnect(session)
		}

		session.Close()
	}()

	// Read Loop
	buf := s.readPool.Get().([]byte)
	defer s.readPool.Put(buf)

	scanner := bufio.NewScanner(conn)
	scanner.Buffer(buf, bufio.MaxScanTokenSize)
	scanner.Split(s.packetSplitter)

	for {
		if s.readTimeout > 0 {
			conn.SetReadDeadline(time.Now().Add(s.readTimeout))
		}

		if !scanner.Scan() {
			if err := scanner.Err(); err != nil {
				if !errors.Is(err, net.ErrClosed) && !errors.Is(err, io.EOF) {
					s.monitor.Logger().Debug("scan error", "error", err, "remote", conn.RemoteAddr())
				}
			}
			return
		}

		// Handle packet
		packet := scanner.Bytes()
		// We must copy the packet because scanner reuses the buffer
		payload := make([]byte, len(packet))
		copy(payload, packet)

		if err := s.handler.Handle(session.Context(), session, payload); err != nil {
			s.monitor.Logger().Error("handle error", "error", err)
			return
		}
	}
}
