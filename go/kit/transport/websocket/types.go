package websocket

import (
	"context"
)

// EventCallback is a generic callback function type that handles all WebSocket events
type EventCallback func(event Event, msg string)

// MessageType defines the types of WebSocket messages
type MessageType string

func (t MessageType) String() string {
	return string(t)
}

type TopicType string

func (t TopicType) String() string {
	return string(t)
}

const (
	MessageTypeWelcome   MessageType = "welcome"
	MessageTypePing      MessageType = "ping"
	MessageTypePong      MessageType = "pong"
	MessageTypeAck       MessageType = "ack"
	MessageTypeError     MessageType = "error"
	MessageTypeMessage   MessageType = "message"
	MessageTypeSubscribe MessageType = "subscribe"
)

// Message represents a message between the WebSocket client and server
type Message struct {
	ID             string      `json:"id"`
	Type           MessageType `json:"type,omitempty"`
	SequenceNumber int64       `json:"sn,omitempty"`
	Topic          TopicType   `json:"topic,omitempty"`
	Subject        string      `json:"subject,omitempty"`
	PrivateChannel bool        `json:"privateChannel,omitempty"`
	Response       bool        `json:"response,omitempty"`
	Data           interface{} `json:"data,omitempty"`
	RawData        string      `json:"-"` // Raw JSON string for debugging
}

// Token holds the token and API endpoint for a WebSocket connection
type Token struct {
	Token        string `json:"token"`
	PingInterval int64  `json:"pingInterval"`
	Endpoint     string `json:"endpoint"`
	Protocol     string `json:"protocol"`
	Encrypt      bool   `json:"encrypt"`
	PingTimeout  int64  `json:"pingTimeout"`
}

// TokenProvider defines a method for retrieving a WebSocket token
type TokenProvider interface {
	GetToken() ([]*Token, error)

	Close() error
}

// WebSocketMessageCallback defines a method for handling WebSocket messages
type WebSocketMessageCallback func(message *Message) error

// Service defines methods for subscribing to
// and unsubscribing from topics in a WebSocket connection
type Service interface {
	// Start starts the WebSocket service and handles incoming WebSocket messages.
	Start() error
	// Stop stops the WebSocket service
	Stop() error
	// Subscribe to a topic with a provided message callback
	Subscribe(topic TopicType, args []string, callback WebSocketMessageCallback) (string, error)
	// Unsubscribe from a topic
	Unsubscribe(id string) error
}

// Client defines methods required for managing a WebSocket connection.
// This includes connecting to the WebSocket, closing the connection,
// writing messages, and reading from the connection.
type Client interface {
	Start() error

	Stop() error

	Write(context.Context, *Message) <-chan error

	Read() <-chan *Message

	Reconnected() <-chan struct{}
}
