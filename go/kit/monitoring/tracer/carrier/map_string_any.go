package carrier

type mapStringAnyCarrier map[string]any

func (m mapStringAnyCarrier) Get(key string) string {
	v, ok := m[key]
	if !ok {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}

func (m mapStringAnyCarrier) Set(key, value string) {
	m[key] = value
}

func (m mapStringAnyCarrier) Keys() []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// NewMapStringAnyCarrier returns a tracer.Carrier wrap over a map[string]any dictionary.
func NewMapStringAnyCarrier(m map[string]any) Carrier {
	if m == nil {
		m = make(map[string]any)
	}

	return mapStringAnyCarrier(m)
}
