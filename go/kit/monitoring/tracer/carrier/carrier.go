// Package carrier implements several carriers for well-known and well-used transports
package carrier

// Carrier abstracts away the details of the store you are going to use to carry the span context over the wire.
type Carrier interface {
	Get(key string) string
	Set(key string, value string)
	Keys() []string
}
