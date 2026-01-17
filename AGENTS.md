# Forge AGENTS.md

## Project Overview

**Forge** is a polyglot shared library monorepo designed to centralize utilities and best practices across the ecosystem. It serves as the single source of truth for reliable, battle-tested code in Go (`go/kit`), TypeScript, and more.

## Build and Test

- **Build**: `forge build`
- **Test**: `forge test` or `go test ./...`
- **Sync**: `forge sync` (regenerates build files)

## Package Reference (`go/kit`)

The `go/kit` library organizes packages by domain and responsibility:

### Core Architecture

- **`application/`**: Clean Architecture primitives.
  - `ctrl/`: presentation layer (controllers).
  - `usecase/`: application business logic.
  - `repository/`: interface definitions for persistence.
- **`transport/`**: Network communication layers.
  - `grpc/`: gRPC server and client helpers.
  - `rest/`: HTTP/REST server and client (Standard Library compatible).
  - `udp/`: UDP server/session management.
  - `websocket/`: WebSocket connection handling.
  - `amqp/`: RabbitMQ/Message Queue consumers and publishers.
- **`persistence/`**: Data access layer.
  - `gormdb/`: GORM (SQL) definitions and Postgres implementation.
  - `redisdb/`: Redis client and helpers.
  - `sqldb/`: generic SQL database patterns.

### Infrastructure & Operations

- **`auth/`**: Authentication and Authorization (JWT, Providers).
- **`monitoring/`**: Observability stack.
  - `logger/`: Structured logging (slog/zap).
  - `metrics/`: Prometheus/OTEL metrics.
  - `tracer/`: OpenTelemetry distributed tracing.
- **`errors/`**: Standardized error handling with codes and details.
- **`distributed/`**: Distributed system primitives (e.g. `idgen` for Snowflake IDs).
- **`sops/`**: Mozilla SOPS integration for secret management.
- **`firebase/`**: Firebase Admin SDK wrappers.
- **`instance/`**: Application instance identity and metadata.

### Data & Resources

- **`jsonapi/`**: JSON:API specification implementation for REST.
- **`resource/`**: Generic resource definitions (CRUD models).
- **`search/`**: Advanced querying, pagination, and cursor management.
- **`filter/`**: Filter DSL for listing resources.
- **`migrator/`**: Database migration utilities.
- **`fixtures/`**: Test data generation and loading.

### Utilities

- **`ptr/`**: Pointer helper functions.
- **`slicesx/`**: Slice manipulation utilities.
- **`retry/`**: Retry mechanisms for transient failures.
- **`saga/`**: Saga pattern implementation for distributed transactions (Orchestration).

## Code Style & Conventions

- **Go Version**: 1.24+
- **Logging**: Use structured logging (key-value pairs) via `monitoring.Monitor`.
  - Example: `logger.Info("User created", "user_id", id)`
  - Avoid string formatting in log messages (e.g., `logger.Infof`).
- **Testing**:
  - Test names must use `CamelCase` (e.g., `TestPriorityQueueConcurrentAccess`).
  - Avoid `snake_case` in test names.
  - Use `testify/assert` and `testify/require`.
  - **Mocking**:
    - Mocks are automatically generated using `mockery` based on `.mockery.yaml`.
    - Mocks are located in `...test` packages alongside their source (e.g., `application/repository` mocks are in `application/repository/repositorytest`).
    - Use these pre-generated mocks instead of writing manual ones.
    - Naming convention: `MockSourceInterface`.
- **Architecture**:
  - Follow Clean Architecture in `application` components.
  - Keep dependencies explicit (DI via Fx or constructors).

## Critical Guidelines

- **Race Conditions**: Ensure concurrency safety, especially in `transport` packages. Verify with `go test -race`.
- **Domain Agnosticism**: Utility packages in `kit` must remain domain-agnostic (e.g., generic priority queues, not "gameplay" queues).
- **Documentation**: Every package should have a `doc.go` file explaining its purpose.
