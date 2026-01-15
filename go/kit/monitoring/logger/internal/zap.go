package internal

import (
	"context"
	"io"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// zapConfig holds the private configuration for zap logger
type zapConfig struct {
	zap.Config
	level  int
	output io.Writer
}

// ZapOption defines a function that can modify the zap logger configuration
type ZapOption func(*zapConfig)

// defaultZapConfig returns the default zap configuration
func defaultZapConfig() []ZapOption {
	zapConfig := WithZapDevelopmentConfig()
	defaultLevel := LogLevelDebug
	if os.Getenv("ENV") != "" && os.Getenv("ENV") != "dev" {
		zapConfig = WithZapProductionConfig()
		defaultLevel = LogLevelInfo
	}

	return []ZapOption{
		zapConfig,
		WithZapLevel(defaultLevel),
		WithZapOutput(os.Stdout),
	}
}

// WithZapProductionConfig sets the production configuration for zap logger
func WithZapProductionConfig() ZapOption {
	return func(cfg *zapConfig) {
		cfg.Config = zap.NewProductionConfig()
	}
}

// WithZapDevelopmentConfig sets the development configuration for zap logger
func WithZapDevelopmentConfig() ZapOption {
	return func(cfg *zapConfig) {
		cfg.Config = zap.NewDevelopmentConfig()
	}
}

// WithZapLevel sets the log level
func WithZapLevel(level int) ZapOption {
	return func(c *zapConfig) {
		c.level = level
	}
}

// WithZapOutput sets the output writer
func WithZapOutput(output io.Writer) ZapOption {
	return func(c *zapConfig) {
		c.output = output
	}
}

type zapLogger struct {
	zap *zap.Logger
}

// NewZapLogger creates a new zap logger with optional configuration
func NewZapLogger(opts ...ZapOption) *zapLogger {
	cfg := &zapConfig{}
	for _, opt := range append(defaultZapConfig(), opts...) {
		opt(cfg)
	}

	stackSkip := 1
	zapOptions := []zap.Option{
		zap.AddCaller(),
		zap.AddCallerSkip(stackSkip),
	}
	zapOptions = append(zapOptions,
		zap.ErrorOutput(zapcore.AddSync(cfg.output)),
	)
	zl, err := cfg.Build(zapOptions...)
	if err != nil {
		panic(err)
	}

	return &zapLogger{
		zap: zl,
	}
}

func (l *zapLogger) Enabled(level int) bool {
	zapLevel := convertLevelToZapLevel(level)
	return l.zap.Core().Enabled(zapLevel)
}

// Context methods
func (l *zapLogger) DebugContext(ctx context.Context, msg string, args ...any) {
	l.zap.Debug(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) InfoContext(ctx context.Context, msg string, args ...any) {
	l.zap.Info(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) WarnContext(ctx context.Context, msg string, args ...any) {
	l.zap.Warn(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) ErrorContext(ctx context.Context, msg string, args ...any) {
	l.zap.Error(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) CriticalContext(ctx context.Context, msg string, args ...any) {
	l.zap.Error(msg, l.convertArgsToZapFields(args...)...)
}

// Non-context methods
func (l *zapLogger) Debug(msg string, args ...any) {
	l.zap.Debug(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) Info(msg string, args ...any) {
	l.zap.Info(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) Warn(msg string, args ...any) {
	l.zap.Warn(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) Error(msg string, args ...any) {
	l.zap.Error(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) Critical(msg string, args ...any) {
	l.zap.Error(msg, l.convertArgsToZapFields(args...)...)
}

func (l *zapLogger) convertArgsToZapFields(args ...any) []zap.Field {
	if len(args) == 0 {
		return nil
	}

	zapFields := make([]zap.Field, 0, len(args)/2)

	for i := 0; i < len(args); i += 2 {
		if i+1 >= len(args) {
			break
		}
		if k, ok := args[i].(string); ok {
			zapFields = append(zapFields, zap.Any(k, args[i+1]))
		}
	}

	return zapFields
}

func convertLevelToZapLevel(level int) zapcore.Level {
	switch level {
	case LogLevelDebug:
		return zapcore.DebugLevel
	case LogLevelInfo:
		return zapcore.InfoLevel
	case LogLevelWarn:
		return zapcore.WarnLevel
	case LogLevelError, LogLevelCritical:
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}
