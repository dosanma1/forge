# Generic TCP Transport

`shared/go-kit/transport/tcp` provides a protocol-agnostic, high-performance TCP server implementation designed for MMO game backends.

## Key Features

1.  **Generic Handlers**: Like gRPC, use `NewHandler[Req, Res]` to handle decoding, logic, and encoding in a type-safe manner.
2.  **Protocol Agnostic**: Supports any packet format (JSON, Binary, Protobuf, etc.) via `bufio.SplitFunc` and Mux extractors.
3.  **High Performance**:
    - **Async Writes**: Uses buffered channels for connection writing, preventing application blocking.
    - **Buffer Pooling**: Uses `sync.Pool` to reuse read buffers, minimizing GC pressure.
    - **Hybrid Mux**: Fast map-based routing dispatch.

## Usage

### 1. Define Request/Response
```go
type MyRequest struct { Msg string }
type MyResponse struct { Ack string }
```

### 2. Create Handler
```go
endpoint := func(ctx context.Context, req MyRequest) (MyResponse, error) {
    return MyResponse{Ack: req.Msg + " received"}, nil
}

// Decoder/Encoder logic (implementation specific)
dec := func(ctx context.Context, p []byte) (MyRequest, error) { ... }
enc := func(ctx context.Context, r MyResponse) ([]byte, error) { ... }

h := tcp.NewHandler(endpoint, dec, enc)
```

### 3. Setup Server
```go
config := &tcp.ServerConfig{
    Address: ":8080",
    PacketSplitter: bufio.ScanLines, // Logic to split stream into frames
    ReadBufferSize: 4096,            // Max frame size optimization
    WriteBufferSize: 128,            // Async write queue size
}

server := tcp.NewServer(config, logger, h)
server.Start()
```

## Performance Analysis

Benchmarks run on Apple M4 Dev Machine (Localhost Loopback):

*   **Sequential Throughput**: ~72,000 RPS
*   **Parallel Throughput**: ~145,000+ RPS (Latency ~7.6µs)

**Capacity Constraint**: The implementation is capable of handling typical MMO World Server loads (thousands of concurrent players) on a single instance.
**Scaling**: For extreme connection counts (>50k), vertical scaling (more cores) works linearly due to Go's netpoller efficiency.

## Architecture

- **Mux**: `map[interface{}]Handler` for O(1) routing.
- **Session**: Manages `net.Conn` and separate goroutine `writeLoop` for sending. 
- **Server**: Manages listener and session lifecycle.
