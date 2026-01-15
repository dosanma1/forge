package carrier

import (
	"google.golang.org/grpc/metadata"
)

type grpcMetadataTextMapCarrier struct {
	metadata.MD
}

func (m grpcMetadataTextMapCarrier) Get(key string) string {
	if s := m.MD.Get(key); len(s) > 0 {
		return s[0]
	}
	return ""
}

func (m grpcMetadataTextMapCarrier) Set(key, value string) {
	m.MD.Set(key, value)
}

func (m grpcMetadataTextMapCarrier) Keys() []string {
	keys := make([]string, 0, len(m.MD))
	for k := range m.MD {
		keys = append(keys, k)
	}
	return keys
}

// NewGRPCMetadataTextMapCarrier returns a tracer.Carrier wrap over a grpc metadata.MD
func NewGRPCMetadataTextMapCarrier(md metadata.MD) Carrier {
	return grpcMetadataTextMapCarrier{
		md,
	}
}
