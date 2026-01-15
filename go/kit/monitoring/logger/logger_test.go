package logger_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/monitoring/logger"
)

func TestLoggerFactory(t *testing.T) {
	tests := []struct {
		name     string
		options  []logger.Option
		expected logger.LoggerType
	}{
		{
			name: "Zap Logger",
			options: []logger.Option{
				logger.WithType(logger.ZapLogger),
				logger.WithLevel(logger.LogLevelInfo),
			},
			expected: logger.ZapLogger,
		},
		{
			name: "Slog Logger",
			options: []logger.Option{
				logger.WithType(logger.SlogLogger),
				logger.WithLevel(logger.LogLevelDebug),
			},
			expected: logger.SlogLogger,
		},
		{
			name: "Default Logger (Zap)",
			options: []logger.Option{
				logger.WithLevel(logger.LogLevelWarn),
			},
			expected: logger.ZapLogger, // Default should be Zap
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create logger using the factory
			l := logger.New(tt.options...)

			// Verify logger is created
			if l == nil {
				t.Fatal("Logger should not be nil")
			}

			// Test basic functionality
			ctx := context.Background()
			l.InfoContext(ctx, "Test message from %s", tt.expected)
			l.DebugContext(context.Background(), "Debug message from %s with value %s", "test", "value")
			l.ErrorContext(context.Background(), "Error message with key=%s", "value")

			// Test level checking
			if !l.Enabled(int(logger.LogLevelError)) {
				t.Errorf("Error level should always be enabled")
			}

			// Test context
			type ctxKeyRequestID struct{}
			ctx = context.WithValue(context.Background(), ctxKeyRequestID{}, "123")
			l.InfoContext(ctx, "Message with context")
		})
	}
}

func TestParseLevel(t *testing.T) {
	tests := []struct {
		input    string
		expected logger.LogLevel
	}{
		{"debug", logger.LogLevelDebug},
		{"DEBUG", logger.LogLevelDebug},
		{"info", logger.LogLevelInfo},
		{"INFO", logger.LogLevelInfo},
		{"warn", logger.LogLevelWarn},
		{"warning", logger.LogLevelWarn},
		{"error", logger.LogLevelError},
		{"critical", logger.LogLevelCritical},
		{"unknown", logger.LogLevelInfo}, // default
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := logger.ParseLevel(tt.input)
			if result != tt.expected {
				t.Errorf("ParseLevel(%s) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}
