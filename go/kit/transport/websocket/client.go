package websocket

import (
	"context"
	"fmt"
	"math/rand"
	"net/url"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
	"github.com/gorilla/websocket"
)

func NewPingMessage() *Message {
	return &Message{
		ID:   IntToString(time.Now().UnixNano()),
		Type: MessageTypePing,
	}
}

type writeMsg struct {
	signal chan error
	ctx    context.Context
	msg    *Message
	time   int64
}

// WebSocketClient represents the WebSocket client
type WebSocketClient struct {
	options          *ClientOption
	conn             *websocket.Conn
	connLock         sync.Mutex
	connected        atomic.Bool
	shutdown         atomic.Bool
	disconnectEvent  chan struct{}
	reconnectedEvent chan struct{}

	tokenProvider      TokenProvider
	tokenInfo          *Token
	closeChan          chan struct{}
	reconnectCloseChan chan struct{}

	writeMsg chan *writeMsg
	readMsg  chan *Message

	ackEvent     map[string]*writeMsg
	ackEventLock sync.Mutex

	wg     sync.WaitGroup
	metric struct {
		pingSuccess int64
		pingErr     int64
		goroutines  int64
	}

	logger logger.Logger
}

// NewWebSocketClient creates a new WebSocketClient instance
func NewWebSocketClient(tokenProvider TokenProvider, logger logger.Logger, options *ClientOption) *WebSocketClient {
	return &WebSocketClient{
		options:            options,
		conn:               nil,
		connLock:           sync.Mutex{},
		connected:          atomic.Bool{},
		shutdown:           atomic.Bool{},
		disconnectEvent:    make(chan struct{}, 1),
		reconnectedEvent:   make(chan struct{}, 1),
		tokenProvider:      tokenProvider,
		tokenInfo:          nil,
		closeChan:          make(chan struct{}),
		reconnectCloseChan: make(chan struct{}),
		writeMsg:           make(chan *writeMsg, options.WriteMessageBuffer),
		readMsg:            make(chan *Message, options.ReadMessageBuffer),
		ackEvent:           make(map[string]*writeMsg),
		ackEventLock:       sync.Mutex{},
		wg:                 sync.WaitGroup{},
		logger:             logger,
	}
}

// Start establishes the WebSocket connection
func (c *WebSocketClient) Start() error {
	c.connLock.Lock()
	defer c.connLock.Unlock()

	if c.connected.Load() {
		return fmt.Errorf("already connected")
	}

	err := c.dial()
	if err != nil {
		return err
	}
	c.connected.Store(true)
	c.notifyEvent(EventConnected, "")
	c.run()
	c.reconnect()
	return nil
}

// Stop closes the WebSocket connection
func (c *WebSocketClient) Stop() error {
	c.connLock.Lock()
	defer c.connLock.Unlock()
	c.notifyEvent(EventClientShutdown, "")
	c.shutdown.Store(true)
	c.close()
	return nil
}

func (c *WebSocketClient) Reconnected() <-chan struct{} {
	return c.reconnectedEvent
}

func (c *WebSocketClient) notifyEvent(event Event, msg string) {
	defer func() {
		if r := recover(); r != nil {
			c.logger.Error("recovered in notifyEvent: %v", r)
		}
	}()

	if c.options.EventCallback != nil {
		c.options.EventCallback(event, msg)
	}
}

func (c *WebSocketClient) run() {
	c.wg.Add(3)
	atomic.AddInt64(&c.metric.goroutines, 3)
	go func() {
		defer func() {
			atomic.AddInt64(&c.metric.goroutines, -1)
			c.wg.Done()
		}()
		c.keepAlive()
	}()
	go func() {
		defer func() {
			atomic.AddInt64(&c.metric.goroutines, -1)
			c.wg.Done()
		}()
		c.readMessages()
	}()
	go func() {
		defer func() {
			atomic.AddInt64(&c.metric.goroutines, -1)
			c.wg.Done()
		}()
		c.writeMessage()
	}()
}

func (c *WebSocketClient) Write(ctx context.Context, ms *Message) <-chan error {
	if !c.connected.Load() {
		ch := make(chan error, 1)
		ch <- fmt.Errorf("not connected")
		return ch
	}

	c.ackEventLock.Lock()
	defer c.ackEventLock.Unlock()

	msg := &writeMsg{
		signal: make(chan error, 1),
		ctx:    ctx,
		msg:    ms,
		time:   time.Now().Unix(),
	}

	c.ackEvent[ms.ID] = msg
	c.writeMsg <- msg
	return msg.signal
}

func (c *WebSocketClient) Read() <-chan *Message {
	return c.readMsg
}

// dial establishes the WebSocket connection
func (c *WebSocketClient) dial() (err error) {
	defer func() {
		if err == nil {
			c.logger.Info("connection established")
		} else {
			c.logger.Error("failed to connect: %v", err)
		}
	}()

	tokenInfo, err := c.tokenProvider.GetToken()
	if err != nil {
		return fmt.Errorf("get token error, %s", err.Error())
	}

	token, err := c.randomEndpoint(tokenInfo)
	if err != nil {
		return err
	}

	c.tokenInfo = token

	// dail websocket
	dialer := websocket.Dialer{
		HandshakeTimeout: c.options.DialTimeout,
		ReadBufferSize:   c.options.ReadBufferBytes,
	}
	q := url.Values{}
	q.Add("connectId", IntToString(time.Now().UnixNano()))
	q.Add("token", token.Token)
	urlStr := fmt.Sprintf("%s?%s", token.Endpoint, q.Encode())

	conn, _, err := dialer.Dial(urlStr, nil)
	if err != nil {
		return err
	}
	c.conn = conn

	// check welcome message
	m := &Message{}
	if err := c.conn.ReadJSON(m); err != nil {
		return err
	}

	if m.Type == MessageTypeError {
		return fmt.Errorf("%s", string(m.RawData))
	}

	if m.Type != MessageTypeWelcome {
		return fmt.Errorf("not receive welcome message")
	}

	return nil
}

// readMessages continuously reads messages from the WebSocket connection
func (c *WebSocketClient) readMessages() {
	for {

		select {
		case <-c.closeChan:
			{
				return
			}
		default:
		}

		m := &Message{}

		if err := c.conn.ReadJSON(m); err != nil {
			c.logger.Error("websocket connection got error: %v", err)
			if !websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.disconnectEvent <- struct{}{}
				return
			}
			continue
		}

		switch m.Type {
		case MessageTypeMessage:
			{
				c.notifyEvent(EventMessageReceived, "")
				select {
				case c.readMsg <- m:
					{
						// ok
					}
				default:
					{
						//warn and break
						c.notifyEvent(EventReadBufferFull, "")
						c.logger.Error("read buffer full")
					}
				}
				break
			}

		case MessageTypePong:
			c.notifyEvent(EventPongReceived, "")
			fallthrough
		case MessageTypeAck:
			fallthrough
		case MessageTypeError:
			{
				func() {
					c.ackEventLock.Lock()
					defer c.ackEventLock.Unlock()

					msg, exist := c.ackEvent[m.ID]
					if !exist {
						c.logger.Error("websocket can not find ack event, id:%s", m.ID)
						return
					}
					var err error
					if m.Type == MessageTypeError {
						err = fmt.Errorf("%s", string(m.RawData))
						c.notifyEvent(EventErrorReceived, err.Error())
					}
					msg.signal <- err
					delete(c.ackEvent, m.ID)
				}()
			}
		default:
			{
				c.logger.Error("websocket unknown type: %v", m.Type)
			}
		}
	}
}

func (c *WebSocketClient) writeMessage() {
	for {
		select {
		case data := <-c.writeMsg:
			select {
			case <-data.ctx.Done():
				// timeout
				c.logger.Warn("websocket write data already exceed deadline, id: %v", data.msg.ID)
				data.signal <- data.ctx.Err()
				c.ackEventLock.Lock()
				delete(c.ackEvent, data.msg.ID)
				c.ackEventLock.Unlock()
				continue
			default:
				// pass
			}

			c.conn.SetWriteDeadline(time.Now().Add(c.options.WriteTimeout))
			err := c.conn.WriteJSON(data.msg)
			if err != nil {
				// remove ack
				data.signal <- err
				c.ackEventLock.Lock()
				delete(c.ackEvent, data.msg.ID)
				c.ackEventLock.Unlock()
				c.logger.Error("websocket write err: %v", err)
			}
		case <-c.closeChan:
			return
		}
	}
}

// keepAlive sends periodic ping messages to keep the connection alive
func (c *WebSocketClient) keepAlive() {
	ticker := time.NewTicker(time.Duration(c.tokenInfo.PingInterval) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			{
				func() {
					ctx, cancel := context.WithTimeout(context.Background(), time.Duration(c.tokenInfo.PingTimeout)*time.Millisecond)
					defer cancel()

					ping := NewPingMessage()
					writeSignal := c.Write(ctx, ping)
					select {
					case err := <-writeSignal:
						{
							if err == nil {
								atomic.AddInt64(&c.metric.pingSuccess, 1)
								c.logger.Debug("heartbeat ping ok")
							} else {
								c.logger.Error("heartbeat ping error: %v", err)
								atomic.AddInt64(&c.metric.pingErr, 1)
							}
						}
					case <-ctx.Done():
						c.logger.Error("heartbeat ping timeout")
						atomic.AddInt64(&c.metric.pingErr, 1)
					}
				}()
			}
		case <-c.closeChan:
			{
				return
			}
		}
	}
}

func (c *WebSocketClient) reconnect() {
	go func() {
		for {
			select {
			case <-c.reconnectCloseChan:
				return

			case <-c.disconnectEvent:

				if c.shutdown.Load() {
					continue
				}

				c.logger.Info("broken websocket connection, start reconnect")

				c.close()
				c.notifyEvent(EventTryReconnect, "")

				attempt := 0
				reconnected := false
				for {
					// Handle reconnect attempts
					if !c.options.Reconnect || (c.options.ReconnectAttempts != -1 && attempt >= c.options.ReconnectAttempts) {
						c.logger.Error("max reconnect attempts reached or reconnect disabled")
						break
					}

					c.logger.Info("reconnecting in %v... (attempt %d)", c.options.ReconnectInterval, attempt)
					time.Sleep(c.options.ReconnectInterval)

					err := c.dial()
					if err == nil {
						c.notifyEvent(EventConnected, "")
						c.closeChan = make(chan struct{})
						c.connected.Store(true)
						c.run()
						c.reconnectedEvent <- struct{}{}
						reconnected = true
						break
					}

					attempt++
				}

				if reconnected {
					continue
				}

				c.notifyEvent(EventClientFail, "")
			}
		}
	}()
}

func (c *WebSocketClient) randomEndpoint(tokens []*Token) (*Token, error) {
	if len(tokens) == 0 {
		return nil, fmt.Errorf("tokens is empty")
	}
	return tokens[rand.Intn(len(tokens))], nil
}

func (c *WebSocketClient) close() {
	if c.connected.CompareAndSwap(true, false) {
		close(c.closeChan)
		c.conn.Close()
		c.wg.Wait()
		c.conn = nil
		c.notifyEvent(EventDisconnected, "")

		c.ackEventLock.Lock()
		// clean up events
		for _, event := range c.ackEvent {
			select {
			case event.signal <- fmt.Errorf("connection closed"):
				// ok
			default:
				// pass
			}
		}
		c.ackEvent = make(map[string]*writeMsg)
		c.ackEventLock.Unlock()

		if c.shutdown.Load() {
			close(c.readMsg)
			close(c.reconnectCloseChan)
		}
	}
	c.tokenProvider.Close()
	c.logger.Info("close websocket client")
}

func IntToString(i int64) string {
	return strconv.FormatInt(i, 10)
}
