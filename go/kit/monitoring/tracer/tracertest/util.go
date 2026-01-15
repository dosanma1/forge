package tracertest

import "context"

func InjectSpan(ctx context.Context, span *Span) context.Context {
	return context.WithValue(ctx, contextKey, span)
}
