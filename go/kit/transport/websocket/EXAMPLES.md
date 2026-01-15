# WebSocket Client Examples

This document provides comprehensive examples demonstrating various use cases and patterns for the WebSocket client.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Advanced Examples](#advanced-examples)
3. [Production Examples](#production-examples)
4. [Testing Examples](#testing-examples)
5. [Integration Examples](#integration-examples)

## Basic Examples

### Example 1: Simple Connection and Subscription

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

func main() {
    // Simple token provider implementation
    tokenProvider := &SimpleTokenProvider{
        endpoint: "wss://api.example.com/websocket",
        token:    "your-auth-token",
    }

    // Basic configuration
    options := websocket.NewClientOptionBuilder().
        WithReconnect(true).
        WithEventCallback(logEvents).
        Build()

    // Create and start client
    client := websocket.NewWebSocketClient(tokenProvider, NewLogger(), options)

    if err := client.Start(); err != nil {
        log.Fatal("Failed to start:", err)
    }
    defer client.Stop()

    // Subscribe to a topic
    subscription := &websocket.Message{
        ID:      "sub-1",
        Type:    websocket.MessageTypeSubscribe,
        Topic:   "/market/ticker:BTC-USDT",
        Subject: "ticker",
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    errChan := client.Write(ctx, subscription)
    if err := <-errChan; err != nil {
        log.Printf("Subscription failed: %v", err)
        return
    }

    // Read messages
    for message := range client.Read() {
        log.Printf("Received: %+v", message)
    }
}

func logEvents(event websocket.Event, msg string) {
    log.Printf("Event: %s - %s", event, msg)
}

type SimpleTokenProvider struct {
    endpoint string
    token    string
}

func (tp *SimpleTokenProvider) GetToken() ([]*websocket.Token, error) {
    return []*websocket.Token{{
        Token:        tp.token,
        PingInterval: 20000,
        Endpoint:     tp.endpoint,
        Protocol:     "websocket",
        Encrypt:      true,
        PingTimeout:  10000,
    }}, nil
}

func (tp *SimpleTokenProvider) Close() error {
    return nil
}
```

### Example 2: Message Processing with Goroutines

```go
package main

import (
    "context"
    "log"
    "sync"
    "time"

    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

func main() {
    client := setupClient()

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // Create a message processor
    processor := NewMessageProcessor()

    // Start processing messages concurrently
    var wg sync.WaitGroup
    wg.Add(1)

    go func() {
        defer wg.Done()
        processor.ProcessMessages(client.Read())
    }()

    // Send multiple subscriptions
    subscriptions := []string{
        "/market/ticker:BTC-USDT",
        "/market/ticker:ETH-USDT",
        "/market/ticker:ADA-USDT",
    }

    for i, topic := range subscriptions {
        msg := &websocket.Message{
            ID:      fmt.Sprintf("sub-%d", i),
            Type:    websocket.MessageTypeSubscribe,
            Topic:   topic,
            Subject: "ticker",
        }

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        errChan := client.Write(ctx, msg)

        go func(topic string) {
            defer cancel()
            if err := <-errChan; err != nil {
                log.Printf("Failed to subscribe to %s: %v", topic, err)
            } else {
                log.Printf("Subscribed to %s", topic)
            }
        }(topic)
    }

    // Keep running for demo
    time.Sleep(30 * time.Second)
}

type MessageProcessor struct {
    tickerChan chan *websocket.Message
    tradeChan  chan *websocket.Message
}

func NewMessageProcessor() *MessageProcessor {
    return &MessageProcessor{
        tickerChan: make(chan *websocket.Message, 100),
        tradeChan:  make(chan *websocket.Message, 100),
    }
}

func (mp *MessageProcessor) ProcessMessages(messages <-chan *websocket.Message) {
    for message := range messages {
        switch message.Subject {
        case "ticker":
            select {
            case mp.tickerChan <- message:
            default:
                log.Println("Ticker channel full, dropping message")
            }
        case "trade":
            select {
            case mp.tradeChan <- message:
            default:
                log.Println("Trade channel full, dropping message")
            }
        default:
            log.Printf("Unknown message type: %s", message.Subject)
        }
    }
}
```

## Advanced Examples

### Example 3: Reconnection with State Management

```go
package main

import (
    "context"
    "log"
    "sync"
    "time"

    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

type StatefulClient struct {
    client        websocket.Client
    subscriptions map[string]*websocket.Message
    mu           sync.RWMutex
    isConnected  bool
}

func NewStatefulClient(tokenProvider websocket.TokenProvider, logger monitoring.Logger) *StatefulClient {
    sc := &StatefulClient{
        subscriptions: make(map[string]*websocket.Message),
    }

    options := websocket.NewClientOptionBuilder().
        WithReconnect(true).
        WithReconnectAttempts(-1).
        WithReconnectInterval(2 * time.Second).
        WithEventCallback(sc.handleEvents).
        Build()

    sc.client = websocket.NewWebSocketClient(tokenProvider, logger, options)
    return sc
}

func (sc *StatefulClient) handleEvents(event websocket.Event, msg string) {
    sc.mu.Lock()
    defer sc.mu.Unlock()

    switch event {
    case websocket.EventConnected:
        log.Println("Connected! Re-subscribing to topics...")
        sc.isConnected = true
        sc.resubscribeAll()

    case websocket.EventDisconnected:
        log.Println("Disconnected!")
        sc.isConnected = false

    case websocket.EventTryReconnect:
        log.Println("Attempting reconnection...")

    case websocket.EventClientFail:
        log.Printf("Client failed: %s", msg)
        sc.isConnected = false

    default:
        log.Printf("Event: %s - %s", event, msg)
    }
}

func (sc *StatefulClient) Subscribe(id, topic, subject string) error {
    sc.mu.Lock()
    defer sc.mu.Unlock()

    message := &websocket.Message{
        ID:      id,
        Type:    websocket.MessageTypeSubscribe,
        Topic:   topic,
        Subject: subject,
    }

    // Store subscription for reconnection
    sc.subscriptions[id] = message

    if sc.isConnected {
        return sc.sendSubscription(message)
    }

    return nil // Will be sent on reconnection
}

func (sc *StatefulClient) Unsubscribe(id string) error {
    sc.mu.Lock()
    defer sc.mu.Unlock()

    delete(sc.subscriptions, id)

    if sc.isConnected {
        message := &websocket.Message{
            ID:   id,
            Type: "unsubscribe",
        }
        return sc.sendSubscription(message)
    }

    return nil
}

func (sc *StatefulClient) resubscribeAll() {
    for _, sub := range sc.subscriptions {
        if err := sc.sendSubscription(sub); err != nil {
            log.Printf("Failed to resubscribe to %s: %v", sub.Topic, err)
        }
    }
}

func (sc *StatefulClient) sendSubscription(msg *websocket.Message) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    errChan := sc.client.Write(ctx, msg)
    return <-errChan
}

func (sc *StatefulClient) Start() error {
    return sc.client.Start()
}

func (sc *StatefulClient) Stop() error {
    return sc.client.Stop()
}

func (sc *StatefulClient) Read() <-chan *websocket.Message {
    return sc.client.Read()
}

func main() {
    tokenProvider := &SimpleTokenProvider{endpoint: "wss://api.example.com"}
    logger := NewLogger()

    client := NewStatefulClient(tokenProvider, logger)

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // Add subscriptions
    client.Subscribe("btc-ticker", "/market/ticker:BTC-USDT", "ticker")
    client.Subscribe("eth-ticker", "/market/ticker:ETH-USDT", "ticker")

    // Process messages
    go func() {
        for message := range client.Read() {
            log.Printf("Message: %+v", message)
        }
    }()

    // Simulate subscription changes
    time.Sleep(10 * time.Second)
    client.Subscribe("ada-ticker", "/market/ticker:ADA-USDT", "ticker")

    time.Sleep(10 * time.Second)
    client.Unsubscribe("btc-ticker")

    select {} // Keep running
}
```

### Example 4: Rate-Limited Message Sending

```go
package main

import (
    "context"
    "log"
    "time"

    "golang.org/x/time/rate"
    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

type RateLimitedClient struct {
    client  websocket.Client
    limiter *rate.Limiter
}

func NewRateLimitedClient(client websocket.Client, rps int) *RateLimitedClient {
    return &RateLimitedClient{
        client:  client,
        limiter: rate.NewLimiter(rate.Limit(rps), rps),
    }
}

func (rlc *RateLimitedClient) WriteWithRateLimit(ctx context.Context, message *websocket.Message) error {
    // Wait for rate limiter
    if err := rlc.limiter.Wait(ctx); err != nil {
        return err
    }

    errChan := rlc.client.Write(ctx, message)
    return <-errChan
}

func main() {
    tokenProvider := &SimpleTokenProvider{endpoint: "wss://api.example.com"}
    logger := NewLogger()

    client := websocket.NewWebSocketClient(tokenProvider, logger, nil)
    rateLimitedClient := NewRateLimitedClient(client, 10) // 10 requests per second

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // Send multiple messages with rate limiting
    topics := []string{
        "/market/ticker:BTC-USDT",
        "/market/ticker:ETH-USDT",
        "/market/ticker:ADA-USDT",
        "/market/ticker:DOT-USDT",
        "/market/ticker:LINK-USDT",
    }

    for i, topic := range topics {
        message := &websocket.Message{
            ID:      fmt.Sprintf("sub-%d", i),
            Type:    websocket.MessageTypeSubscribe,
            Topic:   topic,
            Subject: "ticker",
        }

        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

        start := time.Now()
        if err := rateLimitedClient.WriteWithRateLimit(ctx, message); err != nil {
            log.Printf("Failed to send message: %v", err)
        } else {
            log.Printf("Sent subscription for %s (took %v)", topic, time.Since(start))
        }

        cancel()
    }

    // Process messages
    for message := range client.Read() {
        log.Printf("Received: %+v", message)
    }
}
```

## Production Examples

### Example 5: Enterprise-Grade WebSocket Client

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"

    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

type ProductionClient struct {
    client        websocket.Client
    logger        Logger
    metrics       Metrics
    subscriptions *SubscriptionManager
    config        *Config
    shutdown      chan struct{}
    wg           sync.WaitGroup
}

type Config struct {
    Endpoint              string        `json:"endpoint"`
    ReconnectAttempts     int           `json:"reconnect_attempts"`
    ReconnectInterval     time.Duration `json:"reconnect_interval"`
    DialTimeout          time.Duration `json:"dial_timeout"`
    ReadBufferBytes      int           `json:"read_buffer_bytes"`
    ReadMessageBuffer    int           `json:"read_message_buffer"`
    WriteMessageBuffer   int           `json:"write_message_buffer"`
    WriteTimeout         time.Duration `json:"write_timeout"`
    MetricsEnabled       bool          `json:"metrics_enabled"`
    HealthCheckInterval  time.Duration `json:"health_check_interval"`
}

type SubscriptionManager struct {
    subscriptions map[string]*websocket.Message
    mu           sync.RWMutex
}

func NewSubscriptionManager() *SubscriptionManager {
    return &SubscriptionManager{
        subscriptions: make(map[string]*websocket.Message),
    }
}

func (sm *SubscriptionManager) Add(id string, msg *websocket.Message) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    sm.subscriptions[id] = msg
}

func (sm *SubscriptionManager) Remove(id string) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    delete(sm.subscriptions, id)
}

func (sm *SubscriptionManager) GetAll() []*websocket.Message {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    subs := make([]*websocket.Message, 0, len(sm.subscriptions))
    for _, sub := range sm.subscriptions {
        subs = append(subs, sub)
    }
    return subs
}

func NewProductionClient(config *Config, tokenProvider websocket.TokenProvider, logger Logger, metrics Metrics) *ProductionClient {
    pc := &ProductionClient{
        logger:        logger,
        metrics:       metrics,
        subscriptions: NewSubscriptionManager(),
        config:        config,
        shutdown:      make(chan struct{}),
    }

    options := websocket.NewClientOptionBuilder().
        WithReconnect(true).
        WithReconnectAttempts(config.ReconnectAttempts).
        WithReconnectInterval(config.ReconnectInterval).
        WithDialTimeout(config.DialTimeout).
        WithReadBufferBytes(config.ReadBufferBytes).
        WithReadMessageBuffer(config.ReadMessageBuffer).
        WithWriteMessageBuffer(config.WriteMessageBuffer).
        WithWriteTimeout(config.WriteTimeout).
        WithEventCallback(pc.handleEvents).
        Build()

    pc.client = websocket.NewWebSocketClient(tokenProvider, logger, options)
    return pc
}

func (pc *ProductionClient) handleEvents(event websocket.Event, msg string) {
    pc.logger.Info("WebSocket event", "event", event.String(), "message", msg)

    if pc.config.MetricsEnabled {
        pc.metrics.Counter("websocket_events").
            With("event", event.String()).
            Inc()
    }

    switch event {
    case websocket.EventConnected:
        pc.onConnected()
    case websocket.EventDisconnected:
        pc.onDisconnected()
    case websocket.EventClientFail:
        pc.onClientFail(msg)
    case websocket.EventReadBufferFull, websocket.EventWriteBufferFull:
        pc.onBufferFull(event)
    }
}

func (pc *ProductionClient) onConnected() {
    pc.logger.Info("WebSocket connected, re-subscribing")
    pc.resubscribeAll()

    if pc.config.MetricsEnabled {
        pc.metrics.Gauge("websocket_connected").Set(1)
    }
}

func (pc *ProductionClient) onDisconnected() {
    pc.logger.Warn("WebSocket disconnected")

    if pc.config.MetricsEnabled {
        pc.metrics.Gauge("websocket_connected").Set(0)
    }
}

func (pc *ProductionClient) onClientFail(msg string) {
    pc.logger.Error("WebSocket client failed", "error", msg)

    if pc.config.MetricsEnabled {
        pc.metrics.Counter("websocket_client_failures").Inc()
    }
}

func (pc *ProductionClient) onBufferFull(event websocket.Event) {
    pc.logger.Warn("WebSocket buffer full", "event", event.String())

    if pc.config.MetricsEnabled {
        bufferType := "read"
        if event == websocket.EventWriteBufferFull {
            bufferType = "write"
        }
        pc.metrics.Counter("websocket_buffer_overflows").
            With("type", bufferType).
            Inc()
    }
}

func (pc *ProductionClient) resubscribeAll() {
    subs := pc.subscriptions.GetAll()

    for _, sub := range subs {
        if err := pc.sendMessage(sub); err != nil {
            pc.logger.Error("Failed to resubscribe", "topic", sub.Topic, "error", err)
        } else {
            pc.logger.Info("Resubscribed", "topic", sub.Topic)
        }
    }
}

func (pc *ProductionClient) Subscribe(id, topic, subject string) error {
    message := &websocket.Message{
        ID:      id,
        Type:    websocket.MessageTypeSubscribe,
        Topic:   topic,
        Subject: subject,
    }

    pc.subscriptions.Add(id, message)

    return pc.sendMessage(message)
}

func (pc *ProductionClient) Unsubscribe(id string) error {
    pc.subscriptions.Remove(id)

    message := &websocket.Message{
        ID:   id,
        Type: "unsubscribe",
    }

    return pc.sendMessage(message)
}

func (pc *ProductionClient) sendMessage(msg *websocket.Message) error {
    ctx, cancel := context.WithTimeout(context.Background(), pc.config.WriteTimeout)
    defer cancel()

    errChan := pc.client.Write(ctx, msg)
    return <-errChan
}

func (pc *ProductionClient) Start() error {
    if err := pc.client.Start(); err != nil {
        return err
    }

    // Start message processor
    pc.wg.Add(1)
    go pc.processMessages()

    // Start health checker if enabled
    if pc.config.HealthCheckInterval > 0 {
        pc.wg.Add(1)
        go pc.healthChecker()
    }

    return nil
}

func (pc *ProductionClient) Stop() error {
    close(pc.shutdown)
    pc.wg.Wait()
    return pc.client.Stop()
}

func (pc *ProductionClient) processMessages() {
    defer pc.wg.Done()

    for {
        select {
        case message := <-pc.client.Read():
            pc.handleMessage(message)
        case <-pc.shutdown:
            return
        }
    }
}

func (pc *ProductionClient) handleMessage(message *websocket.Message) {
    pc.logger.Debug("Processing message", "subject", message.Subject, "topic", message.Topic)

    if pc.config.MetricsEnabled {
        pc.metrics.Counter("websocket_messages_received").
            With("subject", message.Subject).
            Inc()
    }

    // Process based on message type
    switch message.Subject {
    case "ticker":
        pc.handleTicker(message)
    case "trade":
        pc.handleTrade(message)
    case "orderbook":
        pc.handleOrderBook(message)
    default:
        pc.logger.Warn("Unknown message subject", "subject", message.Subject)
    }
}

func (pc *ProductionClient) handleTicker(message *websocket.Message) {
    // Implement ticker processing logic
    pc.logger.Debug("Processing ticker", "topic", message.Topic)
}

func (pc *ProductionClient) handleTrade(message *websocket.Message) {
    // Implement trade processing logic
    pc.logger.Debug("Processing trade", "topic", message.Topic)
}

func (pc *ProductionClient) handleOrderBook(message *websocket.Message) {
    // Implement order book processing logic
    pc.logger.Debug("Processing order book", "topic", message.Topic)
}

func (pc *ProductionClient) healthChecker() {
    defer pc.wg.Done()

    ticker := time.NewTicker(pc.config.HealthCheckInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            pc.performHealthCheck()
        case <-pc.shutdown:
            return
        }
    }
}

func (pc *ProductionClient) performHealthCheck() {
    // Implement health check logic
    // For example, send a ping message or check connection status
    pc.logger.Debug("Performing health check")

    if pc.config.MetricsEnabled {
        pc.metrics.Counter("websocket_health_checks").Inc()
    }
}

func main() {
    // Load configuration
    config := &Config{
        Endpoint:              "wss://api.example.com/websocket",
        ReconnectAttempts:     -1,
        ReconnectInterval:     5 * time.Second,
        DialTimeout:          30 * time.Second,
        ReadBufferBytes:      4 * 1024 * 1024,
        ReadMessageBuffer:    2048,
        WriteMessageBuffer:   512,
        WriteTimeout:         30 * time.Second,
        MetricsEnabled:       true,
        HealthCheckInterval:  30 * time.Second,
    }

    // Initialize dependencies
    tokenProvider := &ProductionTokenProvider{endpoint: config.Endpoint}
    logger := NewProductionLogger()
    metrics := NewMetrics()

    // Create client
    client := NewProductionClient(config, tokenProvider, logger, metrics)

    // Start client
    if err := client.Start(); err != nil {
        log.Fatal("Failed to start client:", err)
    }

    // Add subscriptions
    client.Subscribe("btc-ticker", "/market/ticker:BTC-USDT", "ticker")
    client.Subscribe("eth-ticker", "/market/ticker:ETH-USDT", "ticker")

    // Setup graceful shutdown
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    <-sigChan
    log.Println("Shutting down...")

    if err := client.Stop(); err != nil {
        log.Printf("Error during shutdown: %v", err)
    }

    log.Println("Shutdown complete")
}
```

## Testing Examples

### Example 6: Integration Test

```go
package websocket_test

import (
    "context"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/gorilla/websocket"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    ws "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

func TestWebSocketClient_IntegrationTest(t *testing.T) {
    // Create mock WebSocket server
    server := createMockServer(t)
    defer server.Close()

    serverURL := "ws" + server.URL[4:]

    // Create test client
    tokenProvider := &TestTokenProvider{endpoint: serverURL}
    logger := &TestLogger{}

    options := ws.NewClientOptionBuilder().
        WithReconnect(false).
        WithDialTimeout(5 * time.Second).
        WithEventCallback(func(event ws.Event, msg string) {
            t.Logf("Event: %s, Message: %s", event, msg)
        }).
        Build()

    client := ws.NewWebSocketClient(tokenProvider, logger, options)

    // Test connection
    require.NoError(t, client.Start())
    defer client.Stop()

    // Test subscription
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    subscription := &ws.Message{
        ID:      "test-sub",
        Type:    ws.MessageTypeSubscribe,
        Topic:   "/test/topic",
        Subject: "test",
    }

    errChan := client.Write(ctx, subscription)
    assert.NoError(t, <-errChan)

    // Test message reception
    select {
    case message := <-client.Read():
        assert.NotNil(t, message)
        assert.Equal(t, "test", message.Subject)
    case <-time.After(5 * time.Second):
        t.Fatal("No message received within timeout")
    }
}

func createMockServer(t *testing.T) *httptest.Server {
    upgrader := websocket.Upgrader{
        CheckOrigin: func(r *http.Request) bool {
            return true
        },
    }

    return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            t.Errorf("Failed to upgrade connection: %v", err)
            return
        }
        defer conn.Close()

        // Handle WebSocket messages
        for {
            var msg ws.Message
            if err := conn.ReadJSON(&msg); err != nil {
                break
            }

            // Echo back a response
            response := ws.Message{
                ID:      msg.ID + "-response",
                Type:    ws.MessageTypeMessage,
                Subject: msg.Subject,
                Data:    "test data",
            }

            if err := conn.WriteJSON(response); err != nil {
                break
            }
        }
    }))
}

type TestTokenProvider struct {
    endpoint string
}

func (tp *TestTokenProvider) GetToken() ([]*ws.Token, error) {
    return []*ws.Token{{
        Token:        "test-token",
        PingInterval: 20000,
        Endpoint:     tp.endpoint,
        Protocol:     "websocket",
        Encrypt:      false,
        PingTimeout:  10000,
    }}, nil
}

func (tp *TestTokenProvider) Close() error {
    return nil
}

type TestLogger struct{}

func (l *TestLogger) Debug(msg string, args ...interface{}) {}
func (l *TestLogger) Info(msg string, args ...interface{})  {}
func (l *TestLogger) Warn(msg string, args ...interface{})  {}
func (l *TestLogger) Error(msg string, args ...interface{}) {}
```

## Integration Examples

### Example 7: Integration with HTTP API

```go
package main

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"

    "github.com/domi-unimedia/trading-bot/shared/go-kit/transport/websocket"
)

type APIClient struct {
    baseURL    string
    apiKey     string
    apiSecret  string
    httpClient *http.Client
}

func NewAPIClient(baseURL, apiKey, apiSecret string) *APIClient {
    return &APIClient{
        baseURL:   baseURL,
        apiKey:    apiKey,
        apiSecret: apiSecret,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}

func (ac *APIClient) GetToken() ([]*websocket.Token, error) {
    // Create authentication request
    authData := map[string]string{
        "apiKey":    ac.apiKey,
        "apiSecret": ac.apiSecret,
    }

    jsonData, err := json.Marshal(authData)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal auth data: %w", err)
    }

    // Make HTTP request to get WebSocket token
    req, err := http.NewRequest("POST", ac.baseURL+"/api/v1/websocket/token", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")

    resp, err := ac.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
    }

    // Parse response
    var tokenResponse struct {
        Data struct {
            Token           string `json:"token"`
            InstanceServers []struct {
                Endpoint     string `json:"endpoint"`
                Protocol     string `json:"protocol"`
                Encrypt      bool   `json:"encrypt"`
                PingInterval int64  `json:"pingInterval"`
                PingTimeout  int64  `json:"pingTimeout"`
            } `json:"instanceServers"`
        } `json:"data"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    // Convert to websocket tokens
    var tokens []*websocket.Token
    for _, server := range tokenResponse.Data.InstanceServers {
        tokens = append(tokens, &websocket.Token{
            Token:        tokenResponse.Data.Token,
            PingInterval: server.PingInterval,
            Endpoint:     server.Endpoint,
            Protocol:     server.Protocol,
            Encrypt:      server.Encrypt,
            PingTimeout:  server.PingTimeout,
        })
    }

    return tokens, nil
}

func (ac *APIClient) Close() error {
    // Cleanup if needed
    return nil
}

func main() {
    // Create API client that also serves as token provider
    apiClient := NewAPIClient("https://api.example.com", "your-api-key", "your-api-secret")

    // Create WebSocket client
    logger := NewLogger()
    options := websocket.NewClientOptionBuilder().
        WithReconnect(true).
        WithEventCallback(func(event websocket.Event, msg string) {
            fmt.Printf("WebSocket Event: %s - %s\n", event, msg)
        }).
        Build()

    wsClient := websocket.NewWebSocketClient(apiClient, logger, options)

    if err := wsClient.Start(); err != nil {
        panic(err)
    }
    defer wsClient.Stop()

    // Use both HTTP API and WebSocket
    go func() {
        // Example: Get market data via HTTP API
        marketData, err := ac.getMarketData("BTC-USDT")
        if err != nil {
            fmt.Printf("Failed to get market data: %v\n", err)
            return
        }

        fmt.Printf("Current market data: %+v\n", marketData)

        // Subscribe to real-time updates via WebSocket
        subscription := &websocket.Message{
            ID:      "market-data-sub",
            Type:    websocket.MessageTypeSubscribe,
            Topic:   "/market/ticker:BTC-USDT",
            Subject: "ticker",
        }

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        errChan := wsClient.Write(ctx, subscription)
        if err := <-errChan; err != nil {
            fmt.Printf("Failed to subscribe: %v\n", err)
        }
    }()

    // Process real-time messages
    for message := range wsClient.Read() {
        fmt.Printf("Real-time update: %+v\n", message)
    }
}

func (ac *APIClient) getMarketData(symbol string) (map[string]interface{}, error) {
    req, err := http.NewRequest("GET", ac.baseURL+"/api/v1/market/ticker?symbol="+symbol, nil)
    if err != nil {
        return nil, err
    }

    req.Header.Set("API-KEY", ac.apiKey)
    // Add signature if required

    resp, err := ac.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return result, nil
}
```

These examples demonstrate various patterns and use cases for the WebSocket client, from basic usage to enterprise-grade implementations with proper error handling, metrics, and integration with HTTP APIs.
