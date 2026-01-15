package internal

import (
	"context"
	"io"
	"log/slog"
	"os"
)

// slogConfig holds the private configuration for slog logger
type slogConfig struct {
	level  int
	output io.Writer
	format OutputFormat
}

// SlogOption defines a function that can modify the slog logger configuration
type SlogOption func(*slogConfig)

// defaultSlogConfig returns the default slog configuration
func defaultSlogConfig() []SlogOption {
	return []SlogOption{
		WithSlogLevel(LogLevelInfo),
		WithSlogOutput(os.Stdout),
		WithSlogFormat(TextFormat),
	}
}

// WithSlogLevel sets the log level
func WithSlogLevel(level int) SlogOption {
	return func(c *slogConfig) {
		c.level = level
	}
}

// WithSlogOutput sets the output writer
func WithSlogOutput(output io.Writer) SlogOption {
	return func(c *slogConfig) {
		c.output = output
	}
}

// WithSlogFormat sets the output format
func WithSlogFormat(format OutputFormat) SlogOption {
	return func(c *slogConfig) {
		c.format = format
	}
}

type slogLogger struct {
	slog *slog.Logger
}

// NewSlogLogger creates a new slog logger with optional configuration
func NewSlogLogger(opts ...SlogOption) *slogLogger {
	cfg := &slogConfig{}
	for _, opt := range append(defaultSlogConfig(), opts...) {
		opt(cfg)
	}

	level := convertLevelToSlogLevel(cfg.level)

	var handler slog.Handler
	switch cfg.format {
	case JSONFormat:
		handler = slog.NewJSONHandler(cfg.output, &slog.HandlerOptions{
			Level: level,
		})
	case TextFormat:
		handler = slog.NewTextHandler(cfg.output, &slog.HandlerOptions{
			Level: level,
		})
	}

	logger := slog.New(handler)

	return &slogLogger{
		slog: logger,
	}
}

func (l *slogLogger) Enabled(level int) bool {
	slogLevel := convertLevelToSlogLevel(level)
	return l.slog.Enabled(context.Background(), slogLevel)
}

// Context methods
func (l *slogLogger) DebugContext(ctx context.Context, msg string, args ...any) {
	l.slog.DebugContext(ctx, msg, args...)
}

func (l *slogLogger) InfoContext(ctx context.Context, msg string, args ...any) {
	l.slog.InfoContext(ctx, msg, args...)
}

func (l *slogLogger) WarnContext(ctx context.Context, msg string, args ...any) {
	l.slog.WarnContext(ctx, msg, args...)
}

func (l *slogLogger) ErrorContext(ctx context.Context, msg string, args ...any) {
	l.slog.ErrorContext(ctx, msg, args...)
}

func (l *slogLogger) CriticalContext(ctx context.Context, msg string, args ...any) {
	l.slog.ErrorContext(ctx, msg, args...)
}

// Non-context methods
func (l *slogLogger) Debug(msg string, args ...any) {
	l.slog.Debug(msg, args...)
}

func (l *slogLogger) Info(msg string, args ...any) {
	l.slog.Info(msg, args...)
}

func (l *slogLogger) Warn(msg string, args ...any) {
	l.slog.Warn(msg, args...)
}

func (l *slogLogger) Error(msg string, args ...any) {
	l.slog.Error(msg, args...)
}

func (l *slogLogger) Critical(msg string, args ...any) {
	l.slog.Error(msg, args...)
}

func convertLevelToSlogLevel(level int) slog.Level {
	switch level {
	case LogLevelDebug:
		return slog.LevelDebug
	case LogLevelInfo:
		return slog.LevelInfo
	case LogLevelWarn:
		return slog.LevelWarn
	case LogLevelError, LogLevelCritical:
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
