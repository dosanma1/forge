# Architecture Builder Requirements

## Overview

A visual architecture builder in Forge Studio that allows users to design their system architecture first, then generate code from the visual design.

**Key principle**: Design-first, code-generated. Users create nodes and connections visually, and the system generates the corresponding code.

---

## Node Types

### 1. Service Node

**Purpose**: Represents a backend microservice

**Form fields when creating:**
- Name (required)
- Language: `go` | `nestjs`
- Deployer: `helm` | `cloudrun`

**Generated code**: Calls `forge generate service <name> --lang=<language> --deployer=<deployer>`

**Visual representation:**
- Standard container node
- Contains transport action cards (HTTP, gRPC, NATS)
- Each action card has input/output handlers

---

### 2. App Node

**Purpose**: Represents a frontend application

**Form fields when creating:**
- Name (required)
- Framework: `angular` | `nextjs`
- Deployer: `firebase` | `helm` | `cloudrun`

**Generated code**: Calls `forge generate app <name> --framework=<framework> --deployer=<deployer>`

**Visual representation:**
- Standard container node (same shape as services)
- May have HTTP output handlers (API calls)

---

### 3. Library Node

**Purpose**: Represents a shared library

**Form fields when creating:**
- Name (required)
- Language: `go` | `typescript`

**Generated code**: Calls `forge generate library <name> --lang=<language>`

**Visual representation:**
- Standard container node (no transport handlers)
- Can be connected as dependency

---

### 4. Database Node

**Purpose**: Represents a database instance

**Form fields when creating:**
- Name (required)
- Type: `postgresql` | `mysql` | `mongodb` | `redis`
- Connection details (optional)

**Generated code**:
- Adds database to infrastructure config
- Generates connection code in connected services

**Visual representation:**
- Standard container node (same shape as services)
- Has input handlers for connections

---

### 5. Message Broker Node

**Purpose**: Represents a message broker (NATS, Kafka, RabbitMQ)

**Form fields when creating:**
- Name (required)
- Type: `nats` | `kafka` | `rabbitmq`

**Generated code**:
- Adds broker to infrastructure config
- Services connected to it get producer/consumer code

**Visual representation:**
- Standard container node (same shape as services)
- Has topic/stream handlers

---

### 6. API Gateway Node

**Purpose**: Represents the API gateway/ingress

**Form fields when creating:**
- Name (required)
- Type: `nginx` | `kong` | `envoy`

**Generated code**:
- Generates ingress configuration
- Routes based on connected services

**Visual representation:**
- Standard container node (same shape as services)
- Has route handlers

---

## Transport Action Cards

Each **Service Node** contains transport action cards that define how the service communicates.

### HTTP Action Card

**Handlers (endpoints):**
- Each endpoint is an input handler
- Example: `GET /users`, `POST /orders`, `DELETE /items/:id`

**Form to add endpoint:**
- Method: `GET` | `POST` | `PUT` | `PATCH` | `DELETE`
- Path: `/resource` or `/resource/:id`
- Resource name (for code generation)

**Generated code:**
- Creates REST controller
- Creates transport handler
- Creates usecase stub
- Creates repository stub

---

### gRPC Action Card

**Handlers (services/methods):**
- Each RPC method is an input handler
- Example: `AuthService.Authorize`, `ResourceService.Create`

**Form to add method:**
- Service name
- Method name
- Request/Response types

**Generated code:**
- Creates .proto file
- Creates gRPC server implementation
- Creates controller stub

---

### NATS Action Card (Producer)

**Handlers (streams/subjects):**
- Each stream/subject is an output handler
- Example: `notifications`, `audit.events`, `market.ticks`

**Form to add stream:**
- Stream/subject name
- Message type

**Generated code:**
- Creates NATS producer
- Creates message type definition

---

### NATS Action Card (Consumer)

**Handlers (subscriptions):**
- Each subscription is an input handler
- Example: Subscribe to `notifications`, `audit.events`

**Form to add subscription:**
- Stream/subject to subscribe
- Consumer group (optional)

**Generated code:**
- Creates NATS consumer
- Creates handler function

---

## Connection Model

### Edge Types

1. **HTTP Edge**
   - Source: App HTTP output OR API Gateway route
   - Target: Service HTTP endpoint input
   - Label: Shows route path

2. **gRPC Edge**
   - Source: Service gRPC client output
   - Target: Service gRPC server input
   - Label: Shows service.method

3. **NATS Edge**
   - Source: Service NATS producer output
   - Target: Service NATS consumer input
   - Label: Shows stream/subject name

4. **Database Edge**
   - Source: Service
   - Target: Database node
   - Label: Shows connection type

5. **Dependency Edge**
   - Source: Service or App
   - Target: Library node
   - Label: "depends on"

### Connection Rules

| Source Node | Target Node | Edge Type | Generated Code |
|-------------|-------------|-----------|----------------|
| App | Service HTTP endpoint | HTTP | API client call |
| API Gateway | Service HTTP endpoint | HTTP | Ingress route |
| Service A gRPC | Service B gRPC | gRPC | gRPC client stub |
| Service A NATS Producer | Service B NATS Consumer | NATS | Stream subscription |
| Service | Database | Database | Connection config + repository |
| Service | Library | Dependency | Import statement |

---

## Handler Concept

### Output Handlers (Actions)
- Belong to transport action cards
- Represent outgoing connections
- Example: "POST /orders" on HTTP card, "notifications" on NATS Producer

### Input Handlers (Receivers)
- Belong to target nodes or their transport cards
- Represent incoming connections
- Example: Service's HTTP endpoint receives requests, NATS Consumer subscribes to stream

### Visual Connection Flow

```
┌─────────────────────────────────────────┐
│           Service A                      │
│  ┌────────────────────────────────────┐ │
│  │  📡 NATS Producer                  │ │
│  │  ┌─────────────────────────┐       │ │
│  │  │ ● notifications (out)   │───────┼─┼────┐
│  │  └─────────────────────────┘       │ │    │
│  └────────────────────────────────────┘ │    │
└─────────────────────────────────────────┘    │
                                               │
┌─────────────────────────────────────────┐    │
│           Service B                      │    │
│  ┌────────────────────────────────────┐ │    │
│  │  📥 NATS Consumer                  │ │    │
│  │  ┌─────────────────────────┐       │ │    │
│  │  │ ○ notifications (in)    │◄──────┼─┼────┘
│  │  └─────────────────────────┘       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Legend:
- `●` = Output handler (produces)
- `○` = Input handler (consumes)

---

## State Management

### Architecture State

The visual architecture should be saved as JSON in `forge.json` or a separate `architecture.json`:

```json
{
  "nodes": [
    {
      "id": "service-trading",
      "type": "service",
      "position": { "x": 100, "y": 200 },
      "data": {
        "name": "trading",
        "language": "go",
        "deployer": "helm"
      },
      "transports": [
        {
          "type": "http",
          "handlers": [
            { "id": "h1", "method": "GET", "path": "/orders", "direction": "in" },
            { "id": "h2", "method": "POST", "path": "/orders", "direction": "in" }
          ]
        },
        {
          "type": "nats_producer",
          "handlers": [
            { "id": "h3", "stream": "notifications", "direction": "out" }
          ]
        }
      ]
    },
    {
      "id": "service-notification",
      "type": "service",
      "position": { "x": 500, "y": 200 },
      "data": {
        "name": "notification",
        "language": "go",
        "deployer": "helm"
      },
      "transports": [
        {
          "type": "nats_consumer",
          "handlers": [
            { "id": "h4", "stream": "notifications", "direction": "in" }
          ]
        }
      ]
    },
    {
      "id": "db-postgres",
      "type": "database",
      "position": { "x": 100, "y": 400 },
      "data": {
        "name": "main-db",
        "dbType": "postgresql"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "service-trading",
      "sourceHandle": "h3",
      "target": "service-notification",
      "targetHandle": "h4",
      "type": "nats"
    },
    {
      "id": "e2",
      "source": "service-trading",
      "target": "db-postgres",
      "type": "database"
    }
  ]
}
```

---

## Code Generation Flow

### When to Generate

1. **On node creation**: Call `forge generate service/app/library`
2. **On transport handler addition**: Generate endpoint/consumer/producer code
3. **On connection creation**: Generate client code in source, ensure target handler exists
4. **On sync**: `forge sync` regenerates all based on architecture state

### Generation Commands Mapping

| Action | Command |
|--------|---------|
| Create service node | `forge generate service <name>` |
| Create app node | `forge generate app <name>` |
| Create library node | `forge generate library <name>` |
| Add HTTP endpoint | `forge add endpoint <service> <method> <path>` |
| Add gRPC method | `forge add grpc-method <service> <service.method>` |
| Add NATS producer | `forge add nats-producer <service> <stream>` |
| Add NATS consumer | `forge add nats-consumer <service> <stream>` |
| Connect service to DB | `forge add database <service> <db-type>` |

---

## UI Components (ngx-vflow)

### Canvas

- Main graph canvas using ngx-vflow
- Zoom, pan, minimap
- Grid snap

### Node Palette

Sidebar with draggable node types:
- Service
- App
- Library
- Database
- Message Broker
- API Gateway

### Node Inspector

Right panel showing selected node details:
- Node properties (editable)
- Transport cards (add/remove)
- Handlers (add/remove)
- Connections list

### Toolbar

- Add node (opens palette)
- Delete selected
- Sync code (regenerate all)
- Save layout
- Export architecture (JSON)
- Import architecture (JSON)

---

## Open Questions

1. **How to handle existing projects?**
   - Option A: Import existing forge.json and infer architecture
   - Option B: Start from scratch, manually add nodes
   - Option C: Both - import what's possible, user fills gaps

2. **How to handle code changes outside Studio?**
   - Option A: Architecture is source of truth, overwrite changes
   - Option B: Detect drift, warn user
   - Option C: Two-way sync (complex)

3. **How granular should handlers be?**
   - Just transport-level (HTTP, gRPC, NATS)?
   - Or individual endpoints/methods?

4. **How to represent the clean architecture layers?**
   - Show controller → usecase → repository in node details?
   - Or keep it internal implementation detail?

5. **How to handle infrastructure beyond DB?**
   - Redis cache?
   - External APIs?
   - Cloud services (S3, PubSub)?

---

## Implementation Phases

### Phase 1: Core Canvas
- ngx-vflow integration
- Basic node types (Service, Database)
- Drag and drop from palette
- Node inspector panel

### Phase 2: Service Node Details
- Transport action cards (HTTP, gRPC, NATS)
- Handler management (add/edit/delete)
- Form validation

### Phase 3: Connections
- Edge creation between handlers
- Connection rules validation
- Edge labels and styling

### Phase 4: Code Generation Integration
- Call forge-cli generators on node creation
- Generate handler code on endpoint creation
- Sync command

### Phase 5: State Persistence
- Save architecture to forge.json or architecture.json
- Load architecture on project open
- Import/export functionality

---

## Related Files

- `/forge/apps/studio/` - Forge Studio Wails app
- `/forge-cli/internal/generator/` - Code generators
- `/forge/libs/ui/` - Shared UI components (may need graph components)
