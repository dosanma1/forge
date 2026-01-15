# WebSocket Client API Reference

This document provides a comprehensive API reference for the WebSocket client package.

## Table of Contents

1. [Interfaces](#interfaces)
2. [Types](#types)
3. [Constants](#constants)
4. [Functions](#functions)
5. [Configuration](#configuration)
6. [Error Types](#error-types)

## Interfaces

### Client

The main WebSocket client interface.

```go
type Client interface {
    Start() error
    Stop() error
    Write(context.Context, *Message) <-chan error
    Read() <-chan *Message
    Reconnected() <-chan struct{}
}
```

#### Methods

- **Start() error**

  - Starts the WebSocket connection
  - Returns error if connection fails
  - Must be called before using Write() or Read()

- **Stop() error**

  - Gracefully stops the WebSocket connection
  - Closes all channels and goroutines
  - Returns error if shutdown fails

- **Write(ctx context.Context, msg \*Message) <-chan error**

  - Sends a message through the WebSocket connection
  - Returns a channel that will receive any error
  - Context can be used for timeout/cancellation

- **Read() <-chan \*Message**

  - Returns a channel for receiving incoming messages
  - Channel is closed when client stops

- **Reconnected() <-chan struct{}**
  - Returns a channel that signals successful reconnections
  - Useful for re-subscribing after reconnection

### TokenProvider

Interface for providing WebSocket authentication tokens.

```go
type TokenProvider interface {
    GetToken() ([]*Token, error)
    Close() error
}
```

#### Methods

- **GetToken() ([]\*Token, error)**

  - Returns authentication tokens for WebSocket connection
  - May return multiple tokens for load balancing
  - Called automatically when connection is needed

- **Close() error**
  - Cleanup method for releasing resources
  - Called when client is stopped

### WebSocketMessageCallback

Interface for handling incoming WebSocket messages.

```go
type WebSocketMessageCallback interface {
    OnMessage(message *Message) error
}
```

#### Methods

- **OnMessage(message \*Message) error**
  - Processes an incoming WebSocket message
  - Return error if processing fails

### Service

High-level WebSocket service interface.

```go
type Service interface {
    Start() error
    Stop() error
    Subscribe(topic string, args []string, callback WebSocketMessageCallback) (string, error)
    Unsubscribe(id string) error
}
```

#### Methods

- **Start() error**

  - Starts the WebSocket service

- **Stop() error**

  - Stops the WebSocket service

- **Subscribe(topic string, args []string, callback WebSocketMessageCallback) (string, error)**

  - Subscribes to a topic with callback
  - Returns subscription ID

- **Unsubscribe(id string) error**
  - Unsubscribes from a topic by ID

## Types

### Message

Represents a WebSocket message.

```go
type Message struct {
    ID             string      `json:"id"`
    Type           MessageType `json:"type,omitempty"`
    SequenceNumber int64       `json:"sn,omitempty"`
    Topic          string      `json:"topic,omitempty"`
    Subject        string      `json:"subject,omitempty"`
    PrivateChannel bool        `json:"privateChannel,omitempty"`
    Response       bool        `json:"response,omitempty"`
    Data           interface{} `json:"data,omitempty"`
    RawData        string      `json:"-"`
}
```

#### Fields

- **ID**: Unique identifier for the message
- **Type**: Type of message (see MessageType constants)
- **SequenceNumber**: Sequential number for message ordering
- **Topic**: Subscription topic (e.g., "/market/ticker:BTC-USDT")
- **Subject**: Message subject/category (e.g., "ticker", "trade")
- **PrivateChannel**: Indicates if this is a private channel message
- **Response**: Indicates if this is a response message
- **Data**: Message payload data
- **RawData**: Raw JSON string for debugging (not serialized)

### Token

WebSocket authentication token information.

```go
type Token struct {
    Token        string `json:"token"`
    PingInterval int64  `json:"pingInterval"`
    Endpoint     string `json:"endpoint"`
    Protocol     string `json:"protocol"`
    Encrypt      bool   `json:"encrypt"`
    PingTimeout  int64  `json:"pingTimeout"`
}
```

#### Fields

- **Token**: Authentication token string
- **PingInterval**: Ping interval in milliseconds
- **Endpoint**: WebSocket server endpoint URL
- **Protocol**: Protocol type (usually "websocket")
- **Encrypt**: Whether connection should be encrypted
- **PingTimeout**: Ping timeout in milliseconds

### MessageType

Enum for WebSocket message types.

```go
type MessageType string
```

### Event

Enum for WebSocket events.

```go
type Event int
```

### ClientOption

Configuration options for WebSocket client.

```go
type ClientOption struct {
    Reconnect          bool
    ReconnectAttempts  int
    ReconnectInterval  time.Duration
    DialTimeout        time.Duration
    ReadBufferBytes    int
    ReadMessageBuffer  int
    WriteMessageBuffer int
    WriteTimeout       time.Duration
    EventCallback      Callback
}
```

#### Fields

- **Reconnect**: Enable automatic reconnection (default: true)
- **ReconnectAttempts**: Maximum reconnection attempts, -1 for infinite (default: -1)
- **ReconnectInterval**: Time between reconnection attempts (default: 5s)
- **DialTimeout**: Timeout for establishing connection (default: 10s)
- **ReadBufferBytes**: WebSocket read buffer size in bytes (default: 2048000)
- **ReadMessageBuffer**: Message read buffer size (default: 1024)
- **WriteMessageBuffer**: Message write buffer size (default: 256)
- **WriteTimeout**: Write operation timeout (default: 30s)
- **EventCallback**: Function to handle WebSocket events

### Callback

Function type for event callbacks.

```go
type Callback func(event Event, msg string)
```

#### Parameters

- **event**: The WebSocket event that occurred
- **msg**: Additional message or context about the event

## Constants

### MessageType Constants

```go
const (
    MessageTypeWelcome   MessageType = "welcome"
    MessageTypePing      MessageType = "ping"
    MessageTypePong      MessageType = "pong"
    MessageTypeAck       MessageType = "ack"
    MessageTypeError     MessageType = "error"
    MessageTypeMessage   MessageType = "message"
    MessageTypeSubscribe MessageType = "subscribe"
)
```

### Event Constants

```go
const (
    EventConnected        Event = iota // Connection established
    EventDisconnected                  // Connection closed
    EventTryReconnect                  // Attempting reconnection
    EventMessageReceived               // Message received
    EventErrorReceived                 // Error received
    EventPongReceived                  // Pong received
    EventReadBufferFull                // Read buffer full
    EventWriteBufferFull               // Write buffer full
    EventCallbackError                 // Callback error occurred
    EventReSubscribeOK                 // Resubscription successful
    EventReSubscribeError              // Resubscription failed
    EventClientFail                    // Client failure
    EventClientShutdown                // Client shutdown
)
```

## Functions

### NewWebSocketClient

Creates a new WebSocket client instance.

```go
func NewWebSocketClient(tp TokenProvider, logger monitoring.Logger, options *ClientOption) Client
```

#### Parameters

- **tp**: TokenProvider implementation for authentication
- **logger**: Logger implementation for logging
- **options**: Client configuration options (can be nil for defaults)

#### Returns

- **Client**: New WebSocket client instance

#### Example

```go
tokenProvider := &MyTokenProvider{}
logger := NewLogger()
options := NewClientOption()

client := NewWebSocketClient(tokenProvider, logger, options)
```

### NewClientOption

Creates a new ClientOption with default values.

```go
func NewClientOption() *ClientOption
```

#### Returns

- **\*ClientOption**: New ClientOption with default settings

#### Default Values

- Reconnect: true
- ReconnectAttempts: -1 (infinite)
- ReconnectInterval: 5 seconds
- DialTimeout: 10 seconds
- ReadBufferBytes: 2,048,000 bytes (2MB)
- ReadMessageBuffer: 1024 messages
- WriteMessageBuffer: 256 messages
- WriteTimeout: 30 seconds
- EventCallback: nil

### NewClientOptionBuilder

Creates a new ClientOptionBuilder for fluent configuration.

```go
func NewClientOptionBuilder() *ClientOptionBuilder
```

#### Returns

- **\*ClientOptionBuilder**: New builder instance

#### Example

```go
options := NewClientOptionBuilder().
    WithReconnect(true).
    WithReconnectAttempts(5).
    WithReconnectInterval(3 * time.Second).
    WithEventCallback(myEventHandler).
    Build()
```

## Configuration

### ClientOptionBuilder Methods

The ClientOptionBuilder provides a fluent interface for configuring the WebSocket client.

#### WithReconnect

```go
func (b *ClientOptionBuilder) WithReconnect(reconnect bool) *ClientOptionBuilder
```

Enables or disables automatic reconnection.

#### WithReconnectAttempts

```go
func (b *ClientOptionBuilder) WithReconnectAttempts(attempts int) *ClientOptionBuilder
```

Sets the maximum number of reconnection attempts. Use -1 for infinite attempts.

#### WithReconnectInterval

```go
func (b *ClientOptionBuilder) WithReconnectInterval(interval time.Duration) *ClientOptionBuilder
```

Sets the time interval between reconnection attempts.

#### WithDialTimeout

```go
func (b *ClientOptionBuilder) WithDialTimeout(timeout time.Duration) *ClientOptionBuilder
```

Sets the timeout for establishing WebSocket connections.

#### WithReadBufferBytes

```go
func (b *ClientOptionBuilder) WithReadBufferBytes(bytes int) *ClientOptionBuilder
```

Sets the WebSocket read buffer size in bytes.

#### WithReadMessageBuffer

```go
func (b *ClientOptionBuilder) WithReadMessageBuffer(size int) *ClientOptionBuilder
```

Sets the message read buffer size (number of messages).

#### WithWriteMessageBuffer

```go
func (b *ClientOptionBuilder) WithWriteMessageBuffer(size int) *ClientOptionBuilder
```

Sets the message write buffer size (number of messages).

#### WithWriteTimeout

```go
func (b *ClientOptionBuilder) WithWriteTimeout(timeout time.Duration) *ClientOptionBuilder
```

Sets the timeout for write operations.

#### WithEventCallback

```go
func (b *ClientOptionBuilder) WithEventCallback(callback Callback) *ClientOptionBuilder
```

Sets the event callback function.

#### Build

```go
func (b *ClientOptionBuilder) Build() *ClientOption
```

Returns the configured ClientOption instance.

## Error Types

### Common Errors

The WebSocket client may return various types of errors:

#### Connection Errors

- **net.OpError**: Network operation errors
- **websocket.HandshakeError**: WebSocket handshake failures
- **context.DeadlineExceeded**: Timeout errors

#### Usage Errors

- **ErrClientNotStarted**: Client operations called before Start()
- **ErrClientStopped**: Client operations called after Stop()
- **ErrInvalidMessage**: Invalid message format

#### Example Error Handling

```go
if err := client.Start(); err != nil {
    switch {
    case errors.Is(err, context.DeadlineExceeded):
        log.Println("Connection timeout")
    case errors.As(err, &websocket.HandshakeError{}):
        log.Println("Handshake failed")
    default:
        log.Printf("Connection failed: %v", err)
    }
}
```

## Event Handling

### Event Types and Descriptions

| Event                 | Description                         | When Triggered                       |
| --------------------- | ----------------------------------- | ------------------------------------ |
| EventConnected        | Connection established successfully | After successful WebSocket handshake |
| EventDisconnected     | Connection closed                   | When connection is lost or closed    |
| EventTryReconnect     | Attempting to reconnect             | Before each reconnection attempt     |
| EventMessageReceived  | New message received                | When any message arrives             |
| EventErrorReceived    | Error message received              | When server sends error message      |
| EventPongReceived     | Pong response received              | In response to ping messages         |
| EventReadBufferFull   | Read buffer is full                 | When read buffer overflows           |
| EventWriteBufferFull  | Write buffer is full                | When write buffer overflows          |
| EventCallbackError    | Error in callback function          | When event callback returns error    |
| EventReSubscribeOK    | Resubscription successful           | After successful resubscription      |
| EventReSubscribeError | Resubscription failed               | When resubscription fails            |
| EventClientFail       | Client failure                      | On critical client errors            |
| EventClientShutdown   | Client shutdown                     | During graceful shutdown             |

### Event Callback Best Practices

```go
func handleEvents(event Event, msg string) {
    // Use structured logging
    logger.Info("WebSocket event",
        "event", event.String(),
        "message", msg,
        "timestamp", time.Now(),
    )

    // Handle specific events
    switch event {
    case EventConnected:
        // Re-subscribe to topics
        resubscribeAll()

    case EventDisconnected:
        // Handle disconnection
        handleDisconnection()

    case EventReadBufferFull, EventWriteBufferFull:
        // Monitor buffer overflows
        metrics.Counter("buffer_overflows").Inc()

    case EventClientFail:
        // Handle critical errors
        notifyAdministrator(msg)
    }
}
```

## Thread Safety

The WebSocket client is fully thread-safe and uses atomic operations for all shared state. You can safely:

- Call methods from multiple goroutines
- Read from multiple goroutines
- Write from multiple goroutines (writes are serialized internally)

### Atomic Operations

The client uses atomic operations for:

- Connection state management
- Metric counters (ping success/error, goroutine count)
- Buffer management

### Synchronization

Internal synchronization is handled through:

- Atomic variables for counters and flags
- Channels for communication between goroutines
- Context for cancellation and timeouts

This ensures race-condition free operation even under high concurrency.
