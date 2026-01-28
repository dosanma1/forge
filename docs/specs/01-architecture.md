# Forge Framework - System Architecture

**Version:** 1.2.0
**Status:** Active
**Last Updated:** 2026-01-28

---

## Technology Stack & Compliance (STRICT)

**Backend Rule:** All Go code MUST use the internal `go/kit` library.

- **Router:** Use `go/kit/transport/rest` (wraps `http.ServeMux`). **DO NOT** use `chi`, `gin`, or `echo`.
- **DI:** Use `go.uber.org/fx` as integrated in `go/kit`.
- **Logging/Auth:** Use `go/kit` modules only.

**Frontend Rule:** All TypeScript code MUST use libraries from the `ts/` folder.

- **Components:** Use shared components from `ts/ui`.
- **New Libraries:** Adding new external dependencies requires explicit approval.

---

## Core Architectural Principles (Encore-Inspired)

These patterns are **MUST-HAVE** requirements for the Forge architecture, inspired by [Encore.dev](https://github.com/encoredev/encore):

### 1. Builder Interface (Pluggable Code Generation)

All code generators implement a common interface for pluggable, language-agnostic generation:

```go
// pkg/builder/builder.go
type Builder interface {
    Name() string
    Description() string
    Parse(ctx context.Context, opts ParseOptions) (*ParseResult, error)
    Generate(ctx context.Context, opts GenerateOptions) error
    Validate(ctx context.Context, opts ValidateOptions) error
}

// Builder resolution at runtime
func Resolve(projectType string) Builder {
    switch projectType {
    case "go-service":
        return NewGoServiceBuilder()
    case "angular-app":
        return NewAngularBuilder()
    case "nestjs-service":
        return NewNestJSBuilder()
    default:
        return nil
    }
}
```

**Benefits:**

- Language-agnostic architecture
- Easy to add new generators (React, Vue, Python, etc.)
- Testable in isolation

---

### 2. Desktop Application (Wails v3)

Forge Studio runs as a native desktop application using **Wails v3**. This provides:

- **Direct Backend Bindings**: Call Go functions directly from Angular via Wails services (no REST/WS overhead for core logic).
- **Native OS Dialogs**: Use native directory pickers and file dialogs.
- **File Watching**: Native file watching with fsnotify integrated into the Go backend.
- **Single Binary**: The entire Studio (Frontend + Backend) is bundled into a single executable.

```
┌─────────────────┐     ┌─────────────────────┐
│  Forge Studio   │     │  Wails Application  │
│  (Desktop App)  │─────▶│  (Go Services)      │
└─────────────────┘     └────────┬────────────┘
                                 │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
       ┌───────────────┐                     ┌───────────────┐
       │  Angular UI   │                     │  Local API    │
       │  (Webview)    │                     │  (HTTP / Binding)
       └───────────────┘                     └───────────────┘
                                    ▲
                                    │
                            ┌─────────────────┐
                            │  Mac/Win/Linux  │
                            │  System native  │
                            └─────────────────┘
```

**Communication Patterns (Encore-inspired):**

| Path           | Protocol                 | Purpose                     |
| -------------- | ------------------------ | --------------------------- |
| CLI ↔ Daemon  | gRPC (Unix socket)       | Type-safe internal commands |
| Browser ↔ API | REST (HTTP)              | CRUD operations             |
| Browser ↔ API | WebSocket + JSON-RPC 2.0 | Real-time events            |

**WebSocket Events (JSON-RPC 2.0):**

```typescript
// Server → Client notifications
interface FileChangedNotification {
  jsonrpc: '2.0';
  method: 'file.changed';
  params: { path: string; type: 'forge.json' | 'code' };
}

interface GenerationProgressNotification {
  jsonrpc: '2.0';
  method: 'generation.progress';
  params: { percent: number; message: string };
}

// Client → Server requests
interface GenerateRequest {
  jsonrpc: '2.0';
  id: number;
  method: 'generate';
  params: { projectName: string };
}
```

**Why WebSocket over gRPC-Web:**

- Native browser support (no Envoy proxy needed)
- Simpler local dev setup
- Matches Encore's dashboard architecture

---

### 3. Atomic File Operations

All file writes use atomic operations to prevent corruption:

```go
// pkg/xos/xos.go
package xos

import "github.com/google/renameio"

// WriteFile writes data to filename atomically using rename
func WriteFile(filename string, data []byte, perm os.FileMode) error {
    return renameio.WriteFile(filename, data, perm)
}

// WriteFileTemp writes to a temp file first, then renames
func WriteFileTemp(filename string, data []byte, perm os.FileMode) error {
    return renameio.WriteFile(filename, data, perm)
}
```

**Benefits:**

- No corrupted files on crashes
- Cross-platform (fallback to standard write on Windows)
- Safe for concurrent writes

---

### 4. Streaming Output for Long Operations

Long-running operations (workspace creation, code generation) use streaming:

```protobuf
// proto/forge/daemon/daemon.proto
service Daemon {
  rpc CreateWorkspace(CreateWorkspaceRequest) returns (stream CommandMessage);
  rpc Generate(GenerateRequest) returns (stream CommandMessage);
}

message CommandMessage {
  oneof msg {
    CommandOutput output = 1;      // stdout/stderr lines
    CommandProgress progress = 2;  // progress percentage
    CommandComplete complete = 3;  // final result
    CommandError error = 4;        // error details
  }
}
```

**Benefits:**

- Real-time progress in Studio UI
- Better UX for slow operations
- Cancellable operations

---

### 5. Direct Module Import (No exec.Command for Self-Invocation)

Forge API imports forge-cli generators directly as a Go module:

```go
// go.mod
require github.com/dosanma1/forge-cli v0.0.0
replace github.com/dosanma1/forge-cli => ../../forge-cli

// server.go
import "github.com/dosanma1/forge-cli/pkg/generator"

gen := generator.NewWorkspaceGenerator()
gen.Generate(ctx, generator.GeneratorOptions{...})
```

**Benefits:**

- No PATH dependency
- Direct error handling (no stderr parsing)
- Type safety at compile time
- Better testability

---

### 6. Minimal Replace Directives

Keep dependency management clean with minimal replace directives:

```go
// forge/api/go.mod
replace github.com/dosanma1/forge-cli => ../../forge-cli

// forge-cli/go.mod
// No replace directives for external dependencies
```

**Rule:** Only use replace directives for local development of owned modules.

---

## Repository Structure

```
forge/                              # PUBLIC OPEN-SOURCE REPO (SDK + Studio)
├── go/kit/                         # Existing SDK (monitoring, transports, etc.)
├── apps/                           # Desktop applications
│   └── studio/                     # Wails Desktop App (Forge Studio)
│       ├── main.go                 # App entry point
│       ├── services.go             # Wails service bindings
│       ├── frontend/               # Angular frontend logic
│       └── build/                  # Platform specific assets
├── api/                            # Go backend API (FILE-BASED, NO DB)
│   ├── cmd/server/                 # Main entry point
│   └── internal/
│       ├── global/                 # Project management (Recent, Open, Create)
│       └── project/                # Graph & Generation logic
├── ts/                             # Other TypeScript packages
│   └── ui/                         # Shared UI components
├── templates/                      # Infrastructure templates
│   └── codegen/                    # NEW: Code generation templates
├── docs/
│   └── PRD.md                      # This document
└── Makefile                        # `make studio` starts the desktop app

forge-cli/                          # EXISTING CLI REPO (extended)
├── cmd/
│   ├── root.go
│   ├── init.go                     # EXTEND: forge init
│   ├── studio.go                   # NEW: forge studio
│   ├── generate.go                 # NEW: forge generate
│   └── migrate_schema.go           # NEW: forge migrate-schema
├── internal/
│   ├── codegen/                    # Code generation engine
│   │   ├── engine.go
│   │   ├── entity.go
│   │   ├── transport.go
│   │   └── migration.go
│   ├── ast/                        # Go AST parser
│   │   ├── scanner.go
│   │   └── function.go
│   ├── openapi/                    # OpenAPI generator
│   │   └── generator.go
│   └── schema/                     # JSON Schema definitions
│       └── nodes/
├── templates/                      # Code generation templates
│   ├── entity.go.tmpl
│   ├── transport_rest.go.tmpl
│   ├── transport_grpc.go.tmpl
│   ├── transport_nats.go.tmpl
│   ├── module.go.tmpl
│   ├── migration.sql.tmpl
│   └── build.bazel.tmpl
└── go.mod
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPER WORKSTATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ forge studio                                                             │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                        FORGE STUDIO                                │       │
│  │               [ Global Mode / Project Mode ]                       │       │
│  │                                                                   │       │
│  │  ┌──────────────┐   ┌───────────────────────────────┐            │       │
│  │  │ Start Screen │   │          Dashboard            │            │       │
│  │  │ (Recent/New) │   │ (Overview, Arch, Data, API)   │            │       │
│  │  └──────────────┘   └───────────────────────────────┘            │       │
│  │         │                          ▲                                  │       │
│  └─────────┼──────────────────────────┼──────────────────────────────────┘       │
│            │                          │ HTTP / WS                            │
│            ▼                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                        FORGE DAEMON                                │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │       │
│  │  │  Global     │  │  Project    │  │   Code Gen  │               │       │
│  │  │  Manager    │  │  Service    │  │  Orchestrator│              │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │       │
│  └───────────────────────────┬──────────────────────────────────────┘       │
│                               │                                              │
│                               ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    FILE SYSTEM / WORKSPACE                         │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │       │
│  │  │  Project A  │  │  Project B  │  │  Executables│               │       │
│  │  │ (forge.json)│  │ (forge.json)│  │ (forge-cli) │               │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
1. Developer runs: forge studio
   │
   ├── Starts Forge Daemon on localhost:4200
   ├── Servers embedded Angular assets at /
   └── Serves API/WebSocket at /api
   │
   └── Opens Browser (http://localhost:4200)

2. Project Selection
   │
   ├── GET /api/global/recent
   └── ...

3. Studio loads project
   │
   ├── Checks for forge.json in target path
   ├── If missing: Prompt "Initialize Project?" -> calls `forge init`
   ├── If present: Loads project graph data (GET /api/project/graph)
   └── Studio transitions to "Dashboard" mode

4. Developer interacts with Dashboard
   │
   ├── Architecture View: Edit visual graph
   ├── Data Models View: Edit schema/entities
   └── API Ops: Test endpoints

5. Auto-Save & Generate
   │
   ├── Changes are auto-saved to forge.json (debounced)
   ├── POST /api/project/generate - triggers generation
   └── Generated files written to disk (atomic write)

6. Developer adds manual code
   │
   ├── Writes complex domain logic in _custom.go files
   ├── (Future) Exports functions auto-discovered by AST
   └── (Future) Uses //forge:ignore to exclude functions
```

---

## Generated File Structure

```
my-service/
├── forge.json                        # Project definition
├── .sops.yaml                        # SOPS configuration
├── secrets/
│   └── dev.enc.yaml                  # Encrypted secrets example
├── docs/
│   └── openapi.yaml                  # Auto-generated OpenAPI spec
├── cmd/
│   ├── server/
│   │   ├── BUILD.bazel              # Generated
│   │   └── main.go                  # Generated
│   └── migrator/
│       ├── BUILD.bazel              # Generated
│       ├── main.go                  # Generated
│       └── migrations/
│           └── YYYYMMDD_init.up.sql # Generated
├── internal/
│   ├── BUILD.bazel                  # Generated
│   ├── doc.go                       # Generated
│   ├── module.go                    # Generated - Fx wiring
│   ├── types.go                     # Generated - Constants
│   │
│   ├── user.go                      # Generated - Entity
│   ├── user_transport.go            # Generated - Transport
│   ├── user_custom.go               # Manual - Custom logic (preserved)
│   │
│   └── mocks/                       # Generated by mockery
│       └── user_repository_mock.go
├── pkg/
│   ├── api/pb/user/v1/              # Generated gRPC code
│   │   ├── BUILD.bazel
│   │   └── user.pb.go
│   └── proto/user/v1/
│       ├── BUILD.bazel              # Generated
│       └── user.proto               # Generated
├── deploy/
│   └── helm/                        # Generated Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── .mockery.yaml                    # Generated
├── BUILD.bazel                      # Generated
├── go.mod                           # Generated (or updated)
└── Dockerfile                       # Generated
```

---

**Related Specifications:**

- [Overview](00-overview.md)
- [Features](02-features.md)
- [Code Generation](04-code-generation.md)
- [API Specification](06-api-spec.md)
