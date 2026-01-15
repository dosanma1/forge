# Forge

<p align="center">
  <img src="assets/logo.png" alt="Forge Logo" width="200"/>
</p>

**Forge** is a polyglot shared library monorepo designed to centralize utilities and best practices across the ecosystem. It serves as the single source of truth for reliable, battle-tested code in Go, TypeScript, and more.

## Structures

New project structure:

```
forge/
├── go/                 # Go libraries (Go Modules)
│   └── kit/            # Core utilities (formerly trading-bot-legacy/shared/go-kit)
├── ts/                 # TypeScript libraries (npm packages)
│   ├── angular/        # Angular specific libs
│   └── nestjs/         # NestJS specific libs
├── forge.json          # Forge workspace config
├── go.work             # Go workspace
└── MODULE.bazel        # Bazel module configuration
```

## Go Libraries (`go/kit`)

The `go/kit` module provides a comprehensive suite of utilities for building microservices:

- **Transport**: gRPC, REST, WebSocket, AMQP helpers.
- **Persistence**: GORM (Postgres), Redis, Repository patterns.
- **Monitoring**: OpenTelemetry, structured logging (slog/zap).
- **Application**: Repository/UseCase/Controller patterns.

### Installation

```bash
go get github.com/dosanma1/forge/go/kit@latest
```

### Usage

```go
import (
    "github.com/dosanma1/forge/go/kit/monitoring"
    "github.com/dosanma1/forge/go/kit/transport/grpc"
)
```

## Development

This project uses **Forge CLI** and **Bazel** for build and test automation.

### Prerequisites

- Go 1.24+
- Node.js 24+
- Bazel 7.4+ loaded via Bazelisk
- Forge CLI (go install github.com/dosanma1/forge-cli@latest)

### Commands

- **Test**: Run all tests across the monorepo.

  ```bash
  forge test
  # or
  go test ./...
  ```

- **Build**: valid compilation of all packages.

  ```bash
  forge build
  ```

- **Sync**: Regenerate build files and workspace configurations.
  ```bash
  forge sync
  ```
