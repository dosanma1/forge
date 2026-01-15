package carrier

import (
	"net/http"
)

type httpHeaderTextMapCarrier struct {
	http.Header
}

func (m httpHeaderTextMapCarrier) Get(key string) string {
	return m.Header.Get(key)
}

func (m httpHeaderTextMapCarrier) Set(key, value string) {
	m.Header.Set(key, value)
}

func (m httpHeaderTextMapCarrier) Keys() []string {
	keys := make([]string, 0, len(m.Header))
	for k := range m.Header {
		keys = append(keys, k)
	}
	return keys
}

// NewHTTPHeaderTextMapCarrier returns a tracer.Carrier wrapping the http headers.
func NewHTTPHeaderTextMapCarrier(header http.Header) Carrier {
	if header == nil {
		header = make(http.Header)
	}
	return httpHeaderTextMapCarrier{
		header,
	}
}
