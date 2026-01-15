package websocket

import (
	"time"
)

// Event defines the types of WebSocket events
type Event int

const (
	EventConnected        Event = iota // Connection established event
	EventDisconnected                  // Connection closed event
	EventTryReconnect                  // Try to reconnect event
	EventMessageReceived               // Message received event
	EventErrorReceived                 // Error occurred event
	EventPongReceived                  // Pong message received event
	EventReadBufferFull                // The read buffer of WebSocket is full.
	EventWriteBufferFull               // The write buffer of WebSocket is full.
	EventCallbackError                 // An event triggered when an error occurs during a callback operation
	EventReSubscribeOK                 // ReSubscription success event
	EventReSubscribeError              // ReSubscription error event
	EventClientFail                    // Client failure event.
	EventClientShutdown                // Client shutdown event.
)

func (e Event) String() string {
	switch e {
	case EventConnected:
		return "EventConnected"
	case EventDisconnected:
		return "EventDisconnected"
	case EventTryReconnect:
		return "EventTryReconnect"
	case EventMessageReceived:
		return "EventMessageReceived"
	case EventErrorReceived:
		return "EventErrorReceived"
	case EventPongReceived:
		return "EventPongReceived"
	case EventReadBufferFull:
		return "EventReadBufferFull"
	case EventWriteBufferFull:
		return "EventWriteBufferFull"
	case EventCallbackError:
		return "EventCallbackError"
	case EventReSubscribeOK:
		return "EventReSubscribeOK"
	case EventReSubscribeError:
		return "EventReSubscribeError"
	case EventClientFail:
		return "EventClientFail"
	case EventClientShutdown:
		return "EventClientShutdown"
	default:
		return "UnknownEvent"
	}
}

// Callback is a generic callback function type that handles all WebSocket events
type Callback func(event Event, msg string)

// ClientOption contains the settings for the WebSocket client
type ClientOption struct {
	Reconnect          bool          // Enable auto-reconnect; default: true
	ReconnectAttempts  int           // Maximum reconnect attempts, -1 means forever; default: -1
	ReconnectInterval  time.Duration // Interval between reconnect attempts; default: 5s
	DialTimeout        time.Duration // Timeout for establishing a WebSocket connection; default: 10s
	ReadBufferBytes    int           // Specify I/O buffer sizes in bytes. The I/O buffer sizes do not limit the size of the messages that can be sent or received. default:2048000
	ReadMessageBuffer  int           // Read buffer for messages. Messages will be discarded if the buffer becomes full. default: 1024
	WriteMessageBuffer int           // Write buffer for message, Messages will be discarded if the buffer becomes full. default: 256
	WriteTimeout       time.Duration // Write timeout; default: 30s
	EventCallback      Callback      // General callback function to handle all WebSocket events
}

func NewClientOption() *ClientOption {
	return &ClientOption{
		Reconnect:          true,
		ReconnectAttempts:  -1,
		ReconnectInterval:  5 * time.Second,
		DialTimeout:        10 * time.Second,
		ReadBufferBytes:    2048000,
		ReadMessageBuffer:  1024,
		WriteMessageBuffer: 256,
		WriteTimeout:       30 * time.Second,
		EventCallback:      nil,
	}
}

// ClientOptionBuilder is a builder for ClientOption
type ClientOptionBuilder struct {
	option *ClientOption
}

// NewClientOptionBuilder creates a new ClientOptionBuilder
func NewClientOptionBuilder() *ClientOptionBuilder {
	return &ClientOptionBuilder{
		option: NewClientOption(),
	}
}

// WithReconnect sets the Reconnect option
func (b *ClientOptionBuilder) WithReconnect(reconnect bool) *ClientOptionBuilder {
	b.option.Reconnect = reconnect
	return b
}

// WithReconnectAttempts sets the ReconnectAttempts option
func (b *ClientOptionBuilder) WithReconnectAttempts(attempts int) *ClientOptionBuilder {
	b.option.ReconnectAttempts = attempts
	return b
}

// WithReconnectInterval sets the ReconnectInterval option
func (b *ClientOptionBuilder) WithReconnectInterval(interval time.Duration) *ClientOptionBuilder {
	b.option.ReconnectInterval = interval
	return b
}

// WithDialTimeout sets the DialTimeout option
func (b *ClientOptionBuilder) WithDialTimeout(timeout time.Duration) *ClientOptionBuilder {
	b.option.DialTimeout = timeout
	return b
}

// WithReadBufferBytes set the read buffer bytes
func (b *ClientOptionBuilder) WithReadBufferBytes(readBufferBytes int) *ClientOptionBuilder {
	b.option.ReadBufferBytes = readBufferBytes
	return b
}

// WithReadMessageBuffer set the read message buffer
func (b *ClientOptionBuilder) WithReadMessageBuffer(readMessageBuffer int) *ClientOptionBuilder {
	b.option.ReadMessageBuffer = readMessageBuffer
	return b
}

// WithWriteMessageBuffer set the write message buffer
func (b *ClientOptionBuilder) WithWriteMessageBuffer(writeMessageBuffer int) *ClientOptionBuilder {
	b.option.WriteMessageBuffer = writeMessageBuffer
	return b
}

// WithWriteTimeout set the WriteTimeout option
func (b *ClientOptionBuilder) WithWriteTimeout(timeout time.Duration) *ClientOptionBuilder {
	b.option.WriteTimeout = timeout
	return b
}

// WithEventCallback sets the EventCallback option
func (b *ClientOptionBuilder) WithEventCallback(callback Callback) *ClientOptionBuilder {
	b.option.EventCallback = callback
	return b
}

func (b *ClientOptionBuilder) Build() *ClientOption {
	return b.option
}
