// Package websocket provides a reusable WebSocket client implementation
// that can be used across different services for real-time communication.
//
// This package is inspired by the KuCoin Universal SDK WebSocket client
// and provides the following features:
//
//   - Automatic reconnection with configurable retry attempts and intervals
//   - Message acknowledgment system for reliable communication
//   - Heartbeat/ping mechanism to keep connections alive
//   - Event-driven architecture with customizable callbacks
//   - Thread-safe operations with proper synchronization
//   - Configurable buffer sizes and timeouts
//   - Token-based authentication support
//
// Basic Usage:
//
//	// Create a token provider
//	tokenProvider := &MyTokenProvider{}
//
//	// Configure WebSocket client options
//	options := websocket.NewClientOptionBuilder().
//		WithReconnect(true).
//		WithReconnectAttempts(5).
//		WithReconnectInterval(5 * time.Second).
//		WithEventCallback(func(event websocket.Event, msg string) {
//			log.Printf("WebSocket event: %s - %s", event, msg)
//		}).
//		Build()
//
//	// Create the WebSocket client
//	client := websocket.NewClient(tokenProvider, options, monitor)
//
//	// Start the connection
//	if err := client.Start(); err != nil {
//		log.Fatal("Failed to start WebSocket client:", err)
//	}
//
//	// Listen for incoming messages
//	go func() {
//		for message := range client.Read() {
//			log.Printf("Received message: %+v", message)
//		}
//	}()
//
//	// Send a message
//	msg := &websocket.Message{
//		ID:      "unique-message-id",
//		Type:    websocket.MessageTypeSubscribe,
//		Topic:   "/market/ticker:BTC-USDT",
//		Subject: "ticker",
//	}
//
//	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//	defer cancel()
//
//	errChan := client.Write(ctx, msg)
//	if err := <-errChan; err != nil {
//		log.Printf("Failed to send message: %v", err)
//	}
//
//	// Stop the client when done
//	defer client.Stop()
//
// Token Provider Implementation:
//
// You need to implement the TokenProvider interface to provide
// authentication tokens for the WebSocket connection:
//
//	type MyTokenProvider struct {
//		apiKey    string
//		apiSecret string
//		baseURL   string
//	}
//
//	func (tp *MyTokenProvider) GetToken() ([]*websocket.Token, error) {
//		// Implement logic to fetch WebSocket tokens from your API
//		// This typically involves making an HTTP request to get tokens
//		return tokens, nil
//	}
//
//	func (tp *MyTokenProvider) Close() error {
//		// Cleanup resources if needed
//		return nil
//	}
//
// Events:
//
// The client emits various events that you can handle using the EventCallback:
//
//   - EventConnected: Connection established successfully
//   - EventDisconnected: Connection closed
//   - EventTryReconnect: Attempting to reconnect
//   - EventMessageReceived: New message received
//   - EventErrorReceived: Error message received
//   - EventPongReceived: Pong response received
//   - EventReadBufferFull: Read buffer is full (messages may be dropped)
//   - EventWriteBufferFull: Write buffer is full (messages may be dropped)
//   - EventCallbackError: Error occurred in callback function
//   - EventReSubscribeOK: Resubscription successful
//   - EventReSubscribeError: Resubscription failed
//   - EventClientFail: Client failure
//   - EventClientShutdown: Client shutdown
package websocket
