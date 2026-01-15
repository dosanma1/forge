# WebSocket Client Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the WebSocket client.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Connection Problems](#connection-problems)
3. [Message Issues](#message-issues)
4. [Performance Problems](#performance-problems)
5. [Debugging Tools](#debugging-tools)
6. [Monitoring and Metrics](#monitoring-and-metrics)
7. [Best Practices](#best-practices)

## Common Issues

### Issue: Client Fails to Start

#### Symptoms

- `client.Start()` returns an error
- Connection never establishes

#### Possible Causes and Solutions

1. **Invalid Token Provider**

   ```go
   // Check if token provider returns valid tokens
   tokens, err := tokenProvider.GetToken()
   if err != nil {
       log.Printf("Token provider error: %v", err)
   }
   for _, token := range tokens {
       log.Printf("Token: %+v", token)
   }
   ```

2. **Network Connectivity**

   ```bash
   # Test basic connectivity
   curl -I https://api.example.com

   # Test WebSocket endpoint
   wscat -c wss://api.example.com/websocket
   ```

3. **Firewall/Proxy Issues**

   ```go
   // Add proxy support if needed
   proxyURL, _ := url.Parse("http://proxy.company.com:8080")
   dialer := websocket.Dialer{
       Proxy: http.ProxyURL(proxyURL),
   }
   ```

4. **TLS/SSL Issues**
   ```go
   // For development, you might need to skip TLS verification
   dialer := websocket.Dialer{
       TLSClientConfig: &tls.Config{
           InsecureSkipVerify: true, // Only for development!
       },
   }
   ```

### Issue: Frequent Disconnections

#### Symptoms

- `EventDisconnected` events occur frequently
- Connection drops unexpectedly

#### Possible Causes and Solutions

1. **Network Instability**

   ```go
   // Increase reconnection attempts and interval
   options := websocket.NewClientOptionBuilder().
       WithReconnectAttempts(-1).
       WithReconnectInterval(10 * time.Second).
       Build()
   ```

2. **Server-side Timeout**

   ```go
   // Ensure ping/pong is working correctly
   options := websocket.NewClientOptionBuilder().
       WithEventCallback(func(event websocket.Event, msg string) {
           if event == websocket.EventPongReceived {
               log.Println("Pong received - connection alive")
           }
       }).
       Build()
   ```

3. **Idle Connection Timeout**
   ```go
   // Send periodic messages to keep connection alive
   go func() {
       ticker := time.NewTicker(30 * time.Second)
       defer ticker.Stop()

       for range ticker.C {
           ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
           ping := &websocket.Message{
               ID:   fmt.Sprintf("ping-%d", time.Now().Unix()),
               Type: websocket.MessageTypePing,
           }
           client.Write(ctx, ping)
           cancel()
       }
   }()
   ```

### Issue: Messages Not Being Received

#### Symptoms

- `client.Read()` channel receives no messages
- Expected messages don't arrive

#### Possible Causes and Solutions

1. **Subscription Not Sent**

   ```go
   // Verify subscription was sent successfully
   ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
   defer cancel()

   errChan := client.Write(ctx, subscription)
   if err := <-errChan; err != nil {
       log.Printf("Subscription failed: %v", err)
   } else {
       log.Println("Subscription sent successfully")
   }
   ```

2. **Wrong Topic Format**

   ```go
   // Verify topic format matches server expectations
   subscription := &websocket.Message{
       ID:      "sub-1",
       Type:    websocket.MessageTypeSubscribe,
       Topic:   "/market/ticker:BTC-USDT", // Check exact format
       Subject: "ticker",
   }
   ```

3. **Server-side Issues**
   ```go
   // Add debugging to see raw messages
   options := websocket.NewClientOptionBuilder().
       WithEventCallback(func(event websocket.Event, msg string) {
           if event == websocket.EventMessageReceived {
               log.Printf("Raw message: %s", msg)
           }
       }).
       Build()
   ```

### Issue: Buffer Overflow Warnings

#### Symptoms

- `EventReadBufferFull` or `EventWriteBufferFull` events
- Messages being dropped

#### Solutions

1. **Increase Buffer Sizes**

   ```go
   options := websocket.NewClientOptionBuilder().
       WithReadMessageBuffer(4096).    // Increase from default 1024
       WithWriteMessageBuffer(1024).   // Increase from default 256
       WithReadBufferBytes(8 * 1024 * 1024). // 8MB buffer
       Build()
   ```

2. **Process Messages Faster**

   ```go
   // Use multiple goroutines for message processing
   const numWorkers = 4
   messages := make(chan *websocket.Message, 1000)

   // Start workers
   for i := 0; i < numWorkers; i++ {
       go func(workerID int) {
           for msg := range messages {
               processMessage(workerID, msg)
           }
       }(i)
   }

   // Distribute messages to workers
   go func() {
       for msg := range client.Read() {
           select {
           case messages <- msg:
           default:
               log.Println("Worker buffer full, dropping message")
           }
       }
   }()
   ```

## Connection Problems

### Debugging Connection Issues

1. **Enable Verbose Logging**

   ```go
   options := websocket.NewClientOptionBuilder().
       WithEventCallback(func(event websocket.Event, msg string) {
           log.Printf("[%s] WebSocket Event: %s - %s",
               time.Now().Format(time.RFC3339), event, msg)
       }).
       Build()
   ```

2. **Check Token Validity**

   ```go
   type DebugTokenProvider struct {
       original websocket.TokenProvider
   }

   func (dtp *DebugTokenProvider) GetToken() ([]*websocket.Token, error) {
       tokens, err := dtp.original.GetToken()
       if err != nil {
           log.Printf("Token error: %v", err)
           return nil, err
       }

       for i, token := range tokens {
           log.Printf("Token %d: endpoint=%s, interval=%d",
               i, token.Endpoint, token.PingInterval)
       }

       return tokens, nil
   }

   func (dtp *DebugTokenProvider) Close() error {
       return dtp.original.Close()
   }
   ```

3. **Network Diagnostics**

   ```bash
   # Check DNS resolution
   nslookup api.example.com

   # Check port connectivity
   telnet api.example.com 443

   # Test with curl
   curl -v -H "Connection: Upgrade" -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: test" \
        https://api.example.com/websocket
   ```

### Proxy Configuration

```go
func createClientWithProxy(proxyURL string) websocket.Client {
    proxy, _ := url.Parse(proxyURL)

    // Custom dialer with proxy
    dialer := &websocket.Dialer{
        Proxy:            http.ProxyURL(proxy),
        HandshakeTimeout: 45 * time.Second,
    }

    // You would need to modify the client to use custom dialer
    // This is an example of what you might need
}
```

## Message Issues

### Debugging Message Flow

1. **Message Tracing**

   ```go
   type TracingClient struct {
       client websocket.Client
       sentMessages map[string]time.Time
       mu sync.RWMutex
   }

   func (tc *TracingClient) Write(ctx context.Context, msg *websocket.Message) <-chan error {
       tc.mu.Lock()
       tc.sentMessages[msg.ID] = time.Now()
       tc.mu.Unlock()

       log.Printf("Sending message: ID=%s, Type=%s, Topic=%s",
           msg.ID, msg.Type, msg.Topic)

       return tc.client.Write(ctx, msg)
   }

   func (tc *TracingClient) Read() <-chan *websocket.Message {
       msgChan := make(chan *websocket.Message)

       go func() {
           defer close(msgChan)
           for msg := range tc.client.Read() {
               log.Printf("Received message: ID=%s, Type=%s, Subject=%s",
                   msg.ID, msg.Type, msg.Subject)

               tc.mu.RLock()
               if sentTime, exists := tc.sentMessages[msg.ID]; exists {
                   log.Printf("Round trip time for %s: %v",
                       msg.ID, time.Since(sentTime))
               }
               tc.mu.RUnlock()

               msgChan <- msg
           }
       }()

       return msgChan
   }
   ```

2. **Message Validation**
   ```go
   func validateMessage(msg *websocket.Message) error {
       if msg.ID == "" {
           return fmt.Errorf("message ID is required")
       }

       if msg.Type == "" {
           return fmt.Errorf("message type is required")
       }

       if msg.Type == websocket.MessageTypeSubscribe && msg.Topic == "" {
           return fmt.Errorf("topic is required for subscribe messages")
       }

       return nil
   }
   ```

## Performance Problems

### Memory Usage

1. **Monitor Memory Usage**

   ```go
   import "runtime"

   func logMemoryUsage() {
       var m runtime.MemStats
       runtime.ReadMemStats(&m)

       log.Printf("Memory: Alloc=%d KB, TotalAlloc=%d KB, Sys=%d KB, NumGC=%d",
           m.Alloc/1024, m.TotalAlloc/1024, m.Sys/1024, m.NumGC)
   }

   // Call periodically
   go func() {
       ticker := time.NewTicker(30 * time.Second)
       defer ticker.Stop()
       for range ticker.C {
           logMemoryUsage()
       }
   }()
   ```

2. **Prevent Memory Leaks**

   ```go
   // Always close clients properly
   defer func() {
       if err := client.Stop(); err != nil {
           log.Printf("Error stopping client: %v", err)
       }
   }()

   // Don't hold references to old messages
   func processMessage(msg *websocket.Message) {
       // Process immediately, don't store
       switch msg.Subject {
       case "ticker":
           handleTicker(msg.Data)
       }
       // msg will be garbage collected
   }
   ```

### CPU Usage

1. **Optimize Message Processing**

   ```go
   // Use worker pools for CPU-intensive processing
   type MessageWorker struct {
       input  chan *websocket.Message
       output chan ProcessedMessage
   }

   func (w *MessageWorker) Start() {
       go func() {
           for msg := range w.input {
               processed := heavyProcessing(msg)
               w.output <- processed
           }
       }()
   }
   ```

2. **Batch Processing**
   ```go
   func batchProcessor(messages <-chan *websocket.Message) {
       batch := make([]*websocket.Message, 0, 100)
       ticker := time.NewTicker(100 * time.Millisecond)
       defer ticker.Stop()

       for {
           select {
           case msg := <-messages:
               batch = append(batch, msg)
               if len(batch) >= 100 {
                   processBatch(batch)
                   batch = batch[:0] // Reset slice
               }

           case <-ticker.C:
               if len(batch) > 0 {
                   processBatch(batch)
                   batch = batch[:0]
               }
           }
       }
   }
   ```

## Debugging Tools

### Custom Logger

```go
type WebSocketLogger struct {
    *log.Logger
    level LogLevel
}

type LogLevel int

const (
    DEBUG LogLevel = iota
    INFO
    WARN
    ERROR
)

func (wsl *WebSocketLogger) Debug(msg string, args ...interface{}) {
    if wsl.level <= DEBUG {
        wsl.Printf("[DEBUG] %s", fmt.Sprintf(msg, args...))
    }
}

func (wsl *WebSocketLogger) Info(msg string, args ...interface{}) {
    if wsl.level <= INFO {
        wsl.Printf("[INFO] %s", fmt.Sprintf(msg, args...))
    }
}

func (wsl *WebSocketLogger) Warn(msg string, args ...interface{}) {
    if wsl.level <= WARN {
        wsl.Printf("[WARN] %s", fmt.Sprintf(msg, args...))
    }
}

func (wsl *WebSocketLogger) Error(msg string, args ...interface{}) {
    if wsl.level <= ERROR {
        wsl.Printf("[ERROR] %s", fmt.Sprintf(msg, args...))
    }
}
```

### Connection Monitor

```go
type ConnectionMonitor struct {
    client     websocket.Client
    stats      ConnectionStats
    mu         sync.RWMutex
}

type ConnectionStats struct {
    ConnectedAt      time.Time
    DisconnectedAt   time.Time
    ReconnectCount   int64
    MessagesReceived int64
    MessagesSent     int64
    LastPong         time.Time
}

func (cm *ConnectionMonitor) handleEvents(event websocket.Event, msg string) {
    cm.mu.Lock()
    defer cm.mu.Unlock()

    switch event {
    case websocket.EventConnected:
        cm.stats.ConnectedAt = time.Now()
        log.Printf("Connected at %v", cm.stats.ConnectedAt)

    case websocket.EventDisconnected:
        cm.stats.DisconnectedAt = time.Now()
        uptime := cm.stats.DisconnectedAt.Sub(cm.stats.ConnectedAt)
        log.Printf("Disconnected after %v uptime", uptime)

    case websocket.EventTryReconnect:
        cm.stats.ReconnectCount++
        log.Printf("Reconnection attempt #%d", cm.stats.ReconnectCount)

    case websocket.EventPongReceived:
        cm.stats.LastPong = time.Now()

    case websocket.EventMessageReceived:
        cm.stats.MessagesReceived++
    }
}

func (cm *ConnectionMonitor) GetStats() ConnectionStats {
    cm.mu.RLock()
    defer cm.mu.RUnlock()
    return cm.stats
}
```

## Monitoring and Metrics

### Prometheus Metrics

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    wsConnections = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "websocket_connections_total",
            Help: "Total number of WebSocket connections",
        },
        []string{"endpoint", "status"},
    )

    wsMessages = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "websocket_messages_total",
            Help: "Total number of WebSocket messages",
        },
        []string{"endpoint", "direction", "type"},
    )

    wsReconnects = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "websocket_reconnects_total",
            Help: "Total number of WebSocket reconnections",
        },
        []string{"endpoint"},
    )
)

func prometheusEventHandler(endpoint string) websocket.Callback {
    return func(event websocket.Event, msg string) {
        switch event {
        case websocket.EventConnected:
            wsConnections.WithLabelValues(endpoint, "connected").Set(1)
            wsConnections.WithLabelValues(endpoint, "disconnected").Set(0)

        case websocket.EventDisconnected:
            wsConnections.WithLabelValues(endpoint, "connected").Set(0)
            wsConnections.WithLabelValues(endpoint, "disconnected").Set(1)

        case websocket.EventTryReconnect:
            wsReconnects.WithLabelValues(endpoint).Inc()

        case websocket.EventMessageReceived:
            wsMessages.WithLabelValues(endpoint, "inbound", "message").Inc()
        }
    }
}
```

### Health Checks

```go
type HealthChecker struct {
    client        websocket.Client
    lastPong      time.Time
    mu           sync.RWMutex
    unhealthyFunc func()
}

func (hc *HealthChecker) Start() {
    go func() {
        ticker := time.NewTicker(30 * time.Second)
        defer ticker.Stop()

        for range ticker.C {
            hc.checkHealth()
        }
    }()
}

func (hc *HealthChecker) checkHealth() {
    hc.mu.RLock()
    lastPong := hc.lastPong
    hc.mu.RUnlock()

    if time.Since(lastPong) > 60*time.Second {
        log.Println("WebSocket appears unhealthy - no pong in 60 seconds")
        if hc.unhealthyFunc != nil {
            hc.unhealthyFunc()
        }
    }
}

func (hc *HealthChecker) handlePong() {
    hc.mu.Lock()
    hc.lastPong = time.Now()
    hc.mu.Unlock()
}
```

## Best Practices

### Error Handling

```go
// Wrap client for better error handling
type RobustClient struct {
    client   websocket.Client
    retries  int
    backoff  time.Duration
}

func (rc *RobustClient) WriteWithRetry(ctx context.Context, msg *websocket.Message) error {
    for i := 0; i < rc.retries; i++ {
        errChan := rc.client.Write(ctx, msg)
        if err := <-errChan; err != nil {
            if i == rc.retries-1 {
                return fmt.Errorf("failed after %d attempts: %w", rc.retries, err)
            }

            log.Printf("Write attempt %d failed: %v, retrying in %v", i+1, err, rc.backoff)
            time.Sleep(rc.backoff)
            continue
        }

        return nil
    }

    return fmt.Errorf("unreachable code")
}
```

### Configuration Management

```go
type Config struct {
    WebSocket struct {
        Endpoint           string        `yaml:"endpoint"`
        ReconnectAttempts  int           `yaml:"reconnect_attempts"`
        ReconnectInterval  time.Duration `yaml:"reconnect_interval"`
        ReadBufferSize     int           `yaml:"read_buffer_size"`
        WriteBufferSize    int           `yaml:"write_buffer_size"`
        DialTimeout        time.Duration `yaml:"dial_timeout"`
        WriteTimeout       time.Duration `yaml:"write_timeout"`
    } `yaml:"websocket"`
}

func loadConfig(filename string) (*Config, error) {
    data, err := ioutil.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    var config Config
    if err := yaml.Unmarshal(data, &config); err != nil {
        return nil, err
    }

    return &config, nil
}
```

### Testing Strategies

```go
// Mock client for testing
type MockWebSocketClient struct {
    messages chan *websocket.Message
    errors   chan error
    started  bool
}

func NewMockWebSocketClient() *MockWebSocketClient {
    return &MockWebSocketClient{
        messages: make(chan *websocket.Message, 100),
        errors:   make(chan error, 100),
    }
}

func (m *MockWebSocketClient) Start() error {
    m.started = true
    return nil
}

func (m *MockWebSocketClient) Stop() error {
    close(m.messages)
    close(m.errors)
    return nil
}

func (m *MockWebSocketClient) Write(ctx context.Context, msg *websocket.Message) <-chan error {
    errChan := make(chan error, 1)

    if !m.started {
        errChan <- fmt.Errorf("client not started")
    } else {
        errChan <- nil
    }

    return errChan
}

func (m *MockWebSocketClient) Read() <-chan *websocket.Message {
    return m.messages
}

func (m *MockWebSocketClient) Reconnected() <-chan struct{} {
    return make(chan struct{})
}

// Inject test messages
func (m *MockWebSocketClient) SimulateMessage(msg *websocket.Message) {
    m.messages <- msg
}
```

This troubleshooting guide should help you diagnose and resolve most issues you might encounter with the WebSocket client. Remember to enable appropriate logging and monitoring to catch issues early.
