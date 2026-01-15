package workflow

// // Test helpers
// type nullLogger struct{}

// func (n nullLogger) Enabled(level int) bool                                       { return false }
// func (n nullLogger) DebugContext(ctx context.Context, msg string, args ...any)    {}
// func (n nullLogger) InfoContext(ctx context.Context, msg string, args ...any)     {}
// func (n nullLogger) WarnContext(ctx context.Context, msg string, args ...any)     {}
// func (n nullLogger) ErrorContext(ctx context.Context, msg string, args ...any)    {}
// func (n nullLogger) CriticalContext(ctx context.Context, msg string, args ...any) {}
// func (n nullLogger) Debug(msg string, args ...any)                                {}
// func (n nullLogger) Info(msg string, args ...any)                                 {}
// func (n nullLogger) Warn(msg string, args ...any)                                 {}
// func (n nullLogger) Error(msg string, args ...any)                                {}
// func (n nullLogger) Critical(msg string, args ...any)                             {}

// type nullTracer struct{}

// func (n nullTracer) Propagator() tracer.Propagator { return nil }
// func (n nullTracer) Start(ctx context.Context, opts ...tracer.SpanOption) (context.Context, tracer.Span) {
// 	return ctx, &nullSpan{}
// }
// func (n nullTracer) InjectParent(ctx context.Context, traceID, spanID string) context.Context {
// 	return ctx
// }
// func (n nullTracer) End(span tracer.Span)                            {}
// func (n nullTracer) SpanFromContext(ctx context.Context) tracer.Span { return &nullSpan{} }

// type nullSpan struct{}

// func (n *nullSpan) HasSpanID() bool                     { return false }
// func (n *nullSpan) SpanID() tracer.ID                   { return nil }
// func (n *nullSpan) HasTraceID() bool                    { return false }
// func (n *nullSpan) TraceID() tracer.ID                  { return nil }
// func (n *nullSpan) AddEvents(events ...tracer.Event)    {}
// func (n *nullSpan) SetAttributes(kv ...tracer.KeyValue) {}
// func (n *nullSpan) SetOkStatus(description string)      {}
// func (n *nullSpan) SetErrorStatus(description string)   {}
// func (n *nullSpan) Duration() time.Duration             { return 0 }
// func (n *nullSpan) End()                                {}

// func newTestMonitor() monitoring.Monitor {
// 	return monitoring.New(&nullLogger{}, &nullTracer{})
// }

// // MockStreamSource for testing
// type MockStreamSource[T any] struct {
// 	mu             sync.RWMutex
// 	connected      bool
// 	subscriptions  map[string]websocket.WebSocketMessageCallback
// 	stopChan       chan struct{}
// 	startError     error
// 	stopError      error
// 	subscribeError error
// }

// func NewMockStreamSource[T any]() *MockStreamSource[T] {
// 	return &MockStreamSource[T]{
// 		stopChan:      make(chan struct{}),
// 		subscriptions: make(map[string]websocket.WebSocketMessageCallback),
// 	}
// }

// func (m *MockStreamSource[T]) Start() error {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()

// 	if m.startError != nil {
// 		return m.startError
// 	}

// 	m.connected = true
// 	return nil
// }

// func (m *MockStreamSource[T]) Stop() error {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()

// 	if m.stopError != nil {
// 		return m.stopError
// 	}

// 	m.connected = false
// 	select {
// 	case <-m.stopChan:
// 		// Already closed
// 	default:
// 		close(m.stopChan)
// 	}
// 	return nil
// }

// func (m *MockStreamSource[T]) Subscribe(topic websocket.TopicType, args []string, callback websocket.WebSocketMessageCallback) (string, error) {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()

// 	if m.subscribeError != nil {
// 		return "", m.subscribeError
// 	}

// 	subscriptionID := fmt.Sprintf("sub_%d", len(m.subscriptions))
// 	m.subscriptions[subscriptionID] = callback
// 	return subscriptionID, nil
// }

// func (m *MockStreamSource[T]) Unsubscribe(id string) error {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()
// 	delete(m.subscriptions, id)
// 	return nil
// }

// func (m *MockStreamSource[T]) IsConnected() bool {
// 	m.mu.RLock()
// 	defer m.mu.RUnlock()
// 	return m.connected
// }

// func (m *MockStreamSource[T]) SetStartError(err error) {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()
// 	m.startError = err
// }

// func (m *MockStreamSource[T]) SetStopError(err error) {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()
// 	m.stopError = err
// }

// func (m *MockStreamSource[T]) SetSubscribeError(err error) {
// 	m.mu.Lock()
// 	defer m.mu.Unlock()
// 	m.subscribeError = err
// }

// // SimulateMessage simulates receiving a message by calling all registered callbacks
// func (m *MockStreamSource[T]) SimulateMessage(message *websocket.Message) {
// 	m.mu.RLock()
// 	callbacks := make([]websocket.WebSocketMessageCallback, 0, len(m.subscriptions))
// 	for _, callback := range m.subscriptions {
// 		callbacks = append(callbacks, callback)
// 	}
// 	m.mu.RUnlock()

// 	for _, callback := range callbacks {
// 		callback.OnMessage(message)
// 	}
// }

// // Test data structures
// type TestMessage struct {
// 	ID      int    `json:"id"`
// 	Content string `json:"content"`
// }

// func TestStreamingStep(t *testing.T) {
// 	t.Run("successful streaming with callback", func(t *testing.T) {
// 		source := NewMockStreamSource[TestMessage]()
// 		monitor := newTestMonitor()

// 		var receivedMessages []TestMessage
// 		var mu sync.Mutex

// 		// Create the onConnect callback that sets up subscriptions
// 		onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 			_, err := src.Subscribe("test_topic", []string{}, &TestMessageCallback{
// 				onMessage: func(msg TestMessage) error {
// 					mu.Lock()
// 					defer mu.Unlock()
// 					receivedMessages = append(receivedMessages, msg)
// 					return nil
// 				},
// 			})
// 			return err
// 		}

// 		step := NewStreamingStep("test-step", source, onConnect, monitor)

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
// 		defer cancel()

// 		// Start streaming in background
// 		errChan := make(chan error, 1)
// 		go func() {
// 			errChan <- step.Run(ctx, TestMessage{})
// 		}()

// 		// Wait a bit for setup
// 		time.Sleep(time.Millisecond * 100)

// 		// Simulate receiving messages
// 		testMessages := []TestMessage{
// 			{ID: 1, Content: "message1"},
// 			{ID: 2, Content: "message2"},
// 			{ID: 3, Content: "message3"},
// 		}

// 		for _, msg := range testMessages {
// 			messageData := &websocket.Message{
// 				Data: msg,
// 			}
// 			source.SimulateMessage(messageData)
// 		}

// 		// Wait for processing
// 		time.Sleep(time.Millisecond * 200)

// 		// Stop the step
// 		step.Stop()

// 		// Check results
// 		mu.Lock()
// 		defer mu.Unlock()

// 		if len(receivedMessages) != len(testMessages) {
// 			t.Errorf("Expected %d messages, got %d", len(testMessages), len(receivedMessages))
// 		}

// 		for i, expected := range testMessages {
// 			if i < len(receivedMessages) && receivedMessages[i] != expected {
// 				t.Errorf("Message %d: expected %+v, got %+v", i, expected, receivedMessages[i])
// 			}
// 		}
// 	})

// 	t.Run("source start error", func(t *testing.T) {
// 		source := NewMockStreamSource[TestMessage]()
// 		source.SetStartError(fmt.Errorf("start failed"))
// 		monitor := newTestMonitor()

// 		onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 			return nil // Won't be called since start fails
// 		}

// 		step := NewStreamingStep("test-step", source, onConnect, monitor)

// 		ctx := context.Background()
// 		err := step.Run(ctx, TestMessage{})

// 		if err == nil {
// 			t.Error("Expected error from step.Run when source start fails")
// 		}
// 	})

// 	t.Run("subscription error in callback", func(t *testing.T) {
// 		source := NewMockStreamSource[TestMessage]()
// 		source.SetSubscribeError(fmt.Errorf("subscription failed"))
// 		monitor := newTestMonitor()

// 		onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 			_, err := src.Subscribe("test_topic", []string{}, &TestMessageCallback{})
// 			return err
// 		}

// 		step := NewStreamingStep("test-step", source, onConnect, monitor)

// 		ctx := context.Background()
// 		err := step.Run(ctx, TestMessage{})

// 		if err == nil {
// 			t.Error("Expected error from step.Run when subscription fails")
// 		}
// 	})

// 	t.Run("already running error", func(t *testing.T) {
// 		source := NewMockStreamSource[TestMessage]()
// 		monitor := newTestMonitor()

// 		onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 			return nil
// 		}

// 		step := NewStreamingStep("test-step", source, onConnect, monitor).(*StreamingStep[TestMessage])

// 		ctx1, cancel1 := context.WithCancel(context.Background())
// 		defer cancel1()

// 		// Start first run
// 		go step.Run(ctx1, TestMessage{})
// 		time.Sleep(time.Millisecond * 100) // Let it start

// 		// Try to start again
// 		ctx2 := context.Background()
// 		err := step.Run(ctx2, TestMessage{})

// 		if err == nil {
// 			t.Error("Expected error when running already running step")
// 		}

// 		step.Stop()
// 	})

// 	t.Run("multiple subscriptions", func(t *testing.T) {
// 		source := NewMockStreamSource[TestMessage]()
// 		monitor := newTestMonitor()

// 		var topic1Messages []TestMessage
// 		var topic2Messages []TestMessage
// 		var mu sync.Mutex

// 		onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 			// Subscribe to topic1
// 			_, err := src.Subscribe("topic1", []string{}, &TestMessageCallback{
// 				onMessage: func(msg TestMessage) error {
// 					mu.Lock()
// 					defer mu.Unlock()
// 					topic1Messages = append(topic1Messages, msg)
// 					return nil
// 				},
// 			})
// 			if err != nil {
// 				return err
// 			}

// 			// Subscribe to topic2
// 			_, err = src.Subscribe("topic2", []string{}, &TestMessageCallback{
// 				onMessage: func(msg TestMessage) error {
// 					mu.Lock()
// 					defer mu.Unlock()
// 					topic2Messages = append(topic2Messages, msg)
// 					return nil
// 				},
// 			})
// 			return err
// 		}

// 		step := NewStreamingStep("test-step", source, onConnect, monitor)

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
// 		defer cancel()

// 		// Start streaming in background
// 		errChan := make(chan error, 1)
// 		go func() {
// 			errChan <- step.Run(ctx, TestMessage{})
// 		}()

// 		// Wait for setup
// 		time.Sleep(time.Millisecond * 100)

// 		// Simulate receiving messages (both callbacks will be called for each message)
// 		testMessage := TestMessage{ID: 1, Content: "test"}
// 		messageData := &websocket.Message{Data: testMessage}
// 		source.SimulateMessage(messageData)

// 		// Wait for processing
// 		time.Sleep(time.Millisecond * 200)

// 		// Stop the step
// 		step.Stop()

// 		// Check results - both topics should have received the message
// 		mu.Lock()
// 		defer mu.Unlock()

// 		if len(topic1Messages) != 1 {
// 			t.Errorf("Expected 1 message for topic1, got %d", len(topic1Messages))
// 		}
// 		if len(topic2Messages) != 1 {
// 			t.Errorf("Expected 1 message for topic2, got %d", len(topic2Messages))
// 		}
// 	})
// }

// // TestMessageCallback implements websocket.WebSocketMessageCallback for testing
// type TestMessageCallback struct {
// 	onMessage func(TestMessage) error
// }

// func (c *TestMessageCallback) OnMessage(message *websocket.Message) error {
// 	if c.onMessage == nil {
// 		return nil
// 	}

// 	// Convert the message data to TestMessage
// 	if testMsg, ok := message.Data.(TestMessage); ok {
// 		return c.onMessage(testMsg)
// 	}

// 	return fmt.Errorf("unexpected message type: %T", message.Data)
// }

// // Benchmark tests
// func BenchmarkStreamingStep(b *testing.B) {
// 	source := NewMockStreamSource[TestMessage]()
// 	monitor := newTestMonitor()

// 	var counter int64
// 	onConnect := func(ctx context.Context, src StreamSource[TestMessage]) error {
// 		_, err := src.Subscribe("benchmark", []string{}, &TestMessageCallback{
// 			onMessage: func(msg TestMessage) error {
// 				counter++
// 				return nil
// 			},
// 		})
// 		return err
// 	}

// 	step := NewStreamingStep("benchmark", source, onConnect, monitor)

// 	ctx, cancel := context.WithCancel(context.Background())
// 	defer cancel()

// 	go step.Run(ctx, TestMessage{})
// 	time.Sleep(time.Millisecond * 100) // Let it start

// 	b.ResetTimer()

// 	for i := 0; i < b.N; i++ {
// 		messageData := &websocket.Message{
// 			Data: TestMessage{ID: i, Content: "benchmark"},
// 		}
// 		source.SimulateMessage(messageData)
// 	}

// 	// Wait for processing
// 	time.Sleep(time.Millisecond * 100)
// 	step.Stop()
// }
