# Architecture Builder Requirements

## Overview

A visual architecture builder in Forge Studio that allows users to design their system architecture with:

1. **Spec-first for controllers** - Define controller methods in UI, generates interfaces you implement
2. **Spec-first for endpoints** - API surface defined in UI, generates transport handlers

**Key principle:** The spec is the contract. Code must conform to it. If you don't implement a method, it won't compile.

**Clean architecture separation:**
- **Controller layer** → Methods defined in UI (Resource Card = Controller Interface)
- **Repository layer** → Persistence/DB concerns (you implement, not defined in spec)
- **Transport layer** → Endpoints that call controller methods (generated from spec)

---

## UI Model: Drill-Down Navigation

The architecture builder uses a **drill-down/zoom navigation** pattern with two canvas levels.

### Canvas Level 1: Architecture Overview

High-level view of all services, databases, message brokers, and their connections.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Architecture Canvas                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐         ┌─────────────────┐                       │
│   │ workspace-      │         │ workspace-db    │                       │
│   │ service         │────────▶│ (PostgreSQL)    │                       │
│   │                 │         │                 │                       │
│   │ [Double-click]  │         │ [Double-click]  │                       │
│   └─────────────────┘         └─────────────────┘                       │
│          │                                                               │
│          │                    ┌─────────────────┐                       │
│          └───────────────────▶│ NATS            │                       │
│                               │ (Message Broker)│                       │
│                               └─────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Actions:**
- Drag nodes from palette (Service, Database, Message Broker, etc.)
- Draw edges to connect nodes
- **Double-click** a node to drill down into its internal view

---

### Canvas Level 2: Service Internals (Endpoint Designer)

When you **double-click a Service node**, it zooms into an internal view showing:
- **Transport Groups** (HTTP, gRPC, NATS) on the left with endpoint nodes
- **Resource Cards** on the right
- **Arrows** connecting endpoints to the resources they use

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Service: workspace-service                          [← Back to Canvas] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐                                                │
│  │ HTTP                 │         ┌─────────────────────────────────┐   │
│  │  ┌────────────────┐  │         │ 📦 Workspace        [Standard]  │   │
│  │  │ GET            │  │────────▶│                                 │   │
│  │  │ /workspaces/:id│  │         │ GetWorkspace(id) Workspace      │   │
│  │  └────────────────┘  │────────▶│ CreateWorkspace(ws) Workspace   │   │
│  │  ┌────────────────┐  │         │ ListWorkspaces() []Workspace    │   │
│  │  │ POST           │  │         │ + 2 more methods                │   │
│  │  │ /workspaces    │  │         └─────────────────────────────────┘   │
│  │  └────────────────┘  │                                                │
│  │  ┌────────────────┐  │         ┌─────────────────────────────────┐   │
│  │  │ GET            │  │────────▶│ 📦 WorkspaceMember  [Standard]  │   │
│  │  │ /members       │  │         │                                 │   │
│  │  └────────────────┘  │         │ ListMembers() []WorkspaceMember │   │
│  │                      │         │ AddMember(m) WorkspaceMember    │   │
│  │  [+ Add Endpoint]    │         │ RemoveMember(id) error          │   │
│  └──────────────────────┘         └─────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────┐                                                │
│  │ gRPC                 │                                                │
│  │  ┌────────────────┐  │                                                │
│  │  │ ExecuteOrder   │  │─────────▶ (points to Order resource)          │
│  │  └────────────────┘  │                                                │
│  │  [+ Add Method]      │         [+ Add Resource]                      │
│  └──────────────────────┘                                                │
│                                                                          │
│  ┌──────────────────────┐                                                │
│  │ NATS                 │                                                │
│  │  ┌────────────────┐  │                                                │
│  │  │ ● order.created│  │─────────▶ (producer, points to Order)         │
│  │  └────────────────┘  │                                                │
│  │  ┌────────────────┐  │                                                │
│  │  │ ○ market.tick  │  │─────────▶ (consumer, points to handler)       │
│  │  └────────────────┘  │                                                │
│  │  [+ Add Stream]      │                                                │
│  └──────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Legend:**
- `●` = Producer (output)
- `○` = Consumer (input)

---

### Adding a Resource (Controller Interface)

Resources are added via the **[+ Add Resource]** button in the Service Internals view.

A Resource = **Controller Interface**. It defines the methods that all transports can call. The controller does NOT know about database tables - that's the repository's concern.

**Flow:**
1. Click `[+ Add Resource]`
2. Fill form:
   - Resource Name: `Workspace`
   - Base Path: `/workspaces`
   - Version: `v1`
3. Resource card appears on the right (empty, no methods yet)
4. Add methods to define the controller interface

**Add Resource Form:**
```
┌─────────────────────────────────────────────────┐
│ Add Resource (Controller Interface)        [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Name:      [Workspace           ]               │
│                                                 │
│ Base Path: [/workspaces         ]               │
│                                                 │
│ Version:   [v1                  ]               │
│                                                 │
│                         [Cancel] [Add Resource] │
└─────────────────────────────────────────────────┘
```

**Note:** No table selection here. The table is chosen when you implement the repository layer - the controller doesn't care about persistence.

---

### Connecting Endpoints to Resources

After creating a resource:

1. Click `[+ Add Endpoint]` in the HTTP group
2. Fill form (method, path, handler name)
3. **Draw arrow** from endpoint node to resource card
4. The arrow label shows the interface method signature

**The arrow defines which resource the endpoint operates on.**

```
┌────────────────┐                  ┌─────────────────────────┐
│ GET            │                  │ 📦 Workspace            │
│ /workspaces/:id│ ────────────────▶│                         │
└────────────────┘                  │ GetWorkspace() Workspace│
     Endpoint                       └─────────────────────────┘
                                           Resource
```

---

### Resource Card Details

Each resource card shows the **Controller interface** with its methods.

```
┌───────────────────────────────────────────────────────┐
│ 📦 Workspace                                          │
│ BasePath: /workspaces  Version: v1                    │
├───────────────────────────────────────────────────────┤
│ Methods:                            [+ Add Method]    │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Create(ws Workspace) Workspace                    │ │
│ │ Get(id string) Workspace                          │ │
│ │ List(opts ...query.Option) []Workspace            │ │
│ │ Update(id string, ws Workspace) Workspace         │ │
│ │ Delete(id string) error                           │ │
│ │ GetByName(name string) Workspace        [Custom]  │ │
│ └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

**Add Method Form:**
```
┌─────────────────────────────────────────────────┐
│ Add Controller Method                      [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Name:       [GetByName              ]           │
│                                                 │
│ Parameters:                     [+ Add Param]   │
│   ┌───────────────────────────────────────────┐ │
│   │ name     [string ▼]                   [x] │ │
│   └───────────────────────────────────────────┘ │
│                                                 │
│ Returns:    [Workspace ▼]                       │
│             ○ Single  ○ List  ○ Error only      │
│                                                 │
│                           [Cancel] [Add Method] │
└─────────────────────────────────────────────────┘
```

**The Resource Card = Controller Interface**

This interface is **reusable across all transport types**:
- REST transport decodes HTTP request → calls controller method
- gRPC transport decodes protobuf → calls controller method
- NATS transport decodes message → calls controller method

All transports call the **same controller interface**. The controller doesn't know about:
- HTTP methods/paths (that's REST transport)
- Protobuf messages (that's gRPC transport)
- NATS subjects/streams (that's NATS transport)
- Database tables (that's repository layer)

---

## Core Philosophy: Spec-First (Like Swagger)

### How Swagger Works

```
1. Define API in spec/UI
        │
        ▼
2. Generate INTERFACES (contract)
        │
        ▼
3. You IMPLEMENT the interfaces
        │
        ▼
4. Compile fails if you don't implement
```

**The spec controls what gets exposed. Your code must satisfy it.**

- Extra methods you write → not exposed (not in spec)
- Missing implementations → compile error (interface not satisfied)

### Applied to Forge

| Aspect | Source of Truth | Generated |
|--------|-----------------|-----------|
| Controller methods | Spec (UI) | Controller interface |
| REST endpoints | Spec (UI) | Transport handlers that call controller |
| gRPC methods | Spec (UI) | .proto + server interface |
| NATS producers | Spec (UI) | Producer interface |
| NATS consumers | Spec (UI) | Consumer handler interface |
| DB schema | Schema editor | Migrations (separate from controller) |

**Note:** Controller interface methods are defined in the UI via Resource Cards. The controller does NOT know about database tables - that's the repository layer's concern (which you implement manually).

---

## Service vs Resource (Critical Insight)

```
Service: "workspace-service"
│
├── Resource: Workspace (Controller Interface)
│   ├── BasePath: /workspaces
│   ├── Version: v1
│   ├── Methods: (defined in Resource Card)
│   │   ├── Create(ws Workspace) Workspace
│   │   ├── Get(id string) Workspace
│   │   ├── GetByName(name string) Workspace
│   │   └── Delete(id string) error
│   └── Endpoints: (defined in spec, call controller methods)
│       ├── GET    /:id           → Get()
│       ├── POST   /              → Create()
│       ├── GET    /by-name/:name → GetByName()
│       └── DELETE /:id           → Delete()
│
├── Resource: WorkspaceMember (Controller Interface)
│   ├── BasePath: /workspace-members
│   ├── Methods: ListMembers(), AddMember(), RemoveMember()
│   └── Endpoints: ...
```

**Service name ≠ Resource names ≠ Base paths**

**Note:** No table references here. The Resource = Controller Interface. Tables are a repository concern (separate layer you implement).

---

## Complete Flow: Creating Workspace Service

### Step 1: Create Service Node (Canvas Level 1)

On the Architecture Canvas, drag a Service node from the palette.

**Form:**
| Field | Input | Example |
|-------|-------|---------|
| Name | text | `workspace-service` |
| Language | select | `Go` / `NestJS` |
| Deployer | select | `Helm` / `CloudRun` |

→ Creates empty service scaffold

---

### Step 2: Create Database Node (Canvas Level 1)

Drag a Database node from the palette.

**Form:**
| Field | Input | Example |
|-------|-------|---------|
| Name | text | `workspace-db` |
| Type | select | `PostgreSQL` / `MySQL` / `MongoDB` |

---

### Step 3: Connect Service → Database (Canvas Level 1)

Draw edge from service node to database node.

---

### Step 4: Design Database Schema (Double-click Database)

**Double-click** the database node → Opens schema editor (like Supabase Studio):

```
┌─────────────────────────────────────────────────────────────┐
│  Database: workspace-db                          [← Back]   │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ + New Table                                              ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ workspace                                                ││
│  │   ├── id          uuid        PK                        ││
│  │   ├── name        varchar     NOT NULL                  ││
│  │   ├── description text        nullable                  ││
│  │   ├── created_at  timestamp   NOT NULL                  ││
│  │   ├── updated_at  timestamp   NOT NULL                  ││
│  │   └── deleted_at  timestamp   nullable                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Generates migrations automatically** → `cmd/migrator` runs them.

---

### Step 5: Enter Service Internals (Double-click Service)

**Double-click** the service node → Zooms into **Canvas Level 2: Endpoint Designer**

You now see:
- Transport groups (HTTP, gRPC, NATS) on the left
- Resource cards area on the right
- `[← Back to Canvas]` button to return

---

### Step 6: Add Resource (Canvas Level 2)

Click `[+ Add Resource]` button.

**Form:**
| Field | Input | Example |
|-------|-------|---------|
| Resource Name | text | `Workspace` |
| Base Path | text | `/workspaces` |
| Version | text | `v1` |

→ Resource card appears on the right (empty, no methods yet)

---

### Step 6.5: Add Controller Methods

Click `[+ Add Method]` on the Resource Card to define the controller interface.

**Add methods:**
- `Create(ws Workspace) Workspace`
- `Get(id string) Workspace`
- `List(opts ...query.Option) []Workspace`
- `Update(id string, ws Workspace) Workspace`
- `Delete(id string) error`
- `GetByName(name string) Workspace` (custom method)

---

### Step 7: Add Endpoint (Canvas Level 2)

Click `[+ Add Endpoint]` in the HTTP transport group.

**Add Endpoint Form:**
```
┌─────────────────────────────────────────────────┐
│ Add Endpoint                               [X]  │
├─────────────────────────────────────────────────┤
│ Method: [GET ▼]                                 │
│ Path:   /by-name/:name                          │
│ Handler: GetWorkspaceByName                     │
│                                                 │
│ Parameters (auto-detected from path):           │
│   name: string (from :name)                     │
│                                                 │
│ Request Body: [None ▼]                          │
│ Response: [Workspace ▼]                         │
│                                                 │
│                        [Cancel] [Add Endpoint]  │
└─────────────────────────────────────────────────┘
```

→ Endpoint node appears in the HTTP group

---

### Step 8: Connect Endpoint to Resource (Canvas Level 2)

**Draw arrow** from the endpoint node to the Workspace resource card.

This defines:
- The endpoint operates on the Workspace resource
- The interface method signature: `GetWorkspaceByName(name string) (Workspace, error)`

```
┌────────────────┐                  ┌─────────────────────────┐
│ GET            │                  │ 📦 Workspace            │
│ /by-name/:name │ ────────────────▶│                         │
└────────────────┘                  │ GetWorkspaceByName()    │
                                    │ Workspace               │
                                    └─────────────────────────┘
```

---

### Step 9: Generate Code

Click "Generate" button → Creates interfaces from spec:

```go
// internal/gen/workspace_controller.gen.go

// WorkspaceController - YOU MUST IMPLEMENT THIS
type WorkspaceController interface {
    GetWorkspace(ctx context.Context, id string) (Workspace, error)
    CreateWorkspace(ctx context.Context, ws Workspace) (Workspace, error)
    ListWorkspaces(ctx context.Context, opts ...search.Option) (ListResponse[Workspace], error)
    UpdateWorkspace(ctx context.Context, id string, patch PatchRequest) (Workspace, error)
    DeleteWorkspace(ctx context.Context, id string) error
    GetWorkspaceByName(ctx context.Context, name string) (Workspace, error)  // Custom endpoint
}
```

---

### Step 10: Implement the Interface

You write the implementation in your code editor (VSCode):

```go
// internal/workspace_controller.go - YOUR CODE

type workspaceController struct {
    repo gen.WorkspaceRepository
}

func NewWorkspaceController(repo gen.WorkspaceRepository) *workspaceController {
    return &workspaceController{repo: repo}
}

func (c *workspaceController) GetWorkspace(ctx context.Context, id string) (gen.Workspace, error) {
    // Your implementation
}

func (c *workspaceController) GetWorkspaceByName(ctx context.Context, name string) (gen.Workspace, error) {
    // Your custom implementation
}

// ... implement all methods
```

**If you don't implement a method → Compile error!**

---

## Spec-First for All Transports

All transports follow the patterns established in the `forge/go/kit` framework.

### REST Endpoints

**UI defines:**
```
GET  /workspaces/:id      → Get(id)
POST /workspaces          → Create(ws)
GET  /workspaces/by-name  → GetByName(name)
```

**Generates controller interface:**
```go
// gen/workspace_controller.gen.go

type WorkspaceController interface {
    ctrl.Creator[Workspace]
    ctrl.Getter[Workspace]
    ctrl.Lister[Workspace]
    GetByName(ctx context.Context, name string) (Workspace, error)  // Custom method
}
```

**Generates DTO with JSON:API tags:**
```go
// gen/workspace_dto.gen.go

type workspaceDTO struct {
    resource.RestDTO

    RName        string `jsonapi:"attr,name"`
    RDescription string `jsonapi:"attr,description,omitempty"`
}

func workspaceFromDTO(dto *workspaceDTO) Workspace {
    return dto
}

func workspaceToDTO(ws Workspace) *workspaceDTO {
    return &workspaceDTO{
        RestDTO:      resource.ToRestDTO(ws),
        RName:        ws.Name(),
        RDescription: ws.Description(),
    }
}
```

**Generates REST transport:**
```go
// gen/workspace_rest.gen.go

type workspaceRESTCtrl struct {
    create        http.Handler
    get           http.Handler
    list          http.Handler
    getByName     http.Handler
    authenticator rest.HTTPAuthenticator
}

func NewWorkspaceRESTCtrl(
    ctrl WorkspaceController,
    authenticator rest.HTTPAuthenticator,
    m monitoring.Monitor,
) *workspaceRESTCtrl {
    return &workspaceRESTCtrl{
        create: rest.NewJsonApiCreateHandler(ctrl, workspaceFromDTO, workspaceToDTO),
        get:    rest.NewJsonApiGetHandler(ctrl, workspaceToDTO),
        list:   rest.NewJsonApiListHandler(ctrl, workspaceToDTO),
        getByName: rest.NewJsonApiCustomHandler(ctrl.GetByName, workspaceToDTO),  // Custom
        authenticator: authenticator,
    }
}

func (c workspaceRESTCtrl) Version() string   { return "v1" }
func (c workspaceRESTCtrl) BasePath() string  { return "/workspaces" }

func (c workspaceRESTCtrl) Endpoints() []rest.Endpoint {
    return []rest.Endpoint{
        rest.NewCreateEndpoint(rest.RequireAuthentication(c.create, c.authenticator)),
        rest.NewGetEndpoint(rest.RequireAuthentication(c.get, c.authenticator)),
        rest.NewListEndpoint(rest.RequireAuthentication(c.list, c.authenticator)),
        rest.NewEndpoint("GET", "/by-name/:name", rest.RequireAuthentication(c.getByName, c.authenticator)),
    }
}
```

**You implement the controller:**
```go
// internal/workspace_controller.go (YOUR CODE)

type workspaceController struct {
    ctrl.Creator[Workspace]
    ctrl.Getter[Workspace]
    ctrl.Lister[Workspace]
}

func NewWorkspaceController(uc WorkspaceUsecase) *workspaceController {
    return &workspaceController{
        Creator: ctrl.NewCreator(uc),
        Getter:  ctrl.NewGetter(uc),
        Lister:  ctrl.NewLister(uc),
    }
}

func (c *workspaceController) GetByName(ctx context.Context, name string) (Workspace, error) {
    // Your custom implementation
}
```

---

### gRPC Methods

**UI defines:**
```
Service: Authorizer
  - Authorize(permission_id, resource) → authorized (bool)
```

**Generates .proto:**
```protobuf
// pkg/proto/workspace/v1/authorizer.proto

syntax = "proto3";
package workspace.v1;

option go_package = "github.com/dosanma1/trading-bot/backend/services/workspace/pkg/api/pb/workspace/v1;workspace";

service Authorizer {
    rpc Authorize(AuthorizeRequest) returns (AuthorizeResponse) {}
}

message AuthorizeRequest {
    string permission_id = 1;
    ResourceIdentifier resource = 2;
}

message AuthorizeResponse {
    bool authorized = 1;
}
```

**Generates gRPC transport (uses kit grpc.Handler pattern):**
```go
// gen/authorizer_grpc.gen.go

type authorizerGrpcCtrl struct {
    workspacev1.UnimplementedAuthorizerServer  // Embedded proto stub

    authorizeHandler grpc.Handler
}

func NewAuthorizerGRPCController(
    authzCtrl AuthorizerController,
    grpcAuthenticator grpc.GRPCAuthenticator,
    monitor monitoring.Monitor,
) *authorizerGrpcCtrl {
    return &authorizerGrpcCtrl{
        authorizeHandler: grpc.NewHandler(
            func(ctx context.Context, req *workspacev1.AuthorizeRequest) (bool, error) {
                return authzCtrl.Authorize(ctx, req.PermissionId, nil)
            },
            decodeAuthorizeRequest,
            encodeAuthorizeResponse,
            monitor,
        ),
    }
}

func (s *authorizerGrpcCtrl) Authorize(ctx context.Context, req *workspacev1.AuthorizeRequest) (*workspacev1.AuthorizeResponse, error) {
    return grpc.Serve[*workspacev1.AuthorizeRequest, *workspacev1.AuthorizeResponse](ctx, s.authorizeHandler, req)
}

func decodeAuthorizeRequest(ctx context.Context, req *workspacev1.AuthorizeRequest) (*workspacev1.AuthorizeRequest, error) {
    return req, nil
}

func encodeAuthorizeResponse(ctx context.Context, authorized bool) (*workspacev1.AuthorizeResponse, error) {
    return &workspacev1.AuthorizeResponse{Authorized: authorized}, nil
}
```

**You implement the controller:**
```go
// internal/authorizer_controller.go (YOUR CODE)

type AuthorizerController interface {
    Authorize(ctx context.Context, permissionID string, resource any) (bool, error)
}

type authorizerController struct {
    uc AuthorizerUsecase
}

func (c *authorizerController) Authorize(ctx context.Context, permissionID string, resource any) (bool, error) {
    // Your authorization logic
}
```

---

### NATS Producers

**UI defines:**
```
Producer: notifications
  Subject: notifications
  Message: Notification (protobuf)
```

**Generates producer constructor (uses kit nats.Producer pattern):**
```go
// gen/notification_nats.gen.go

func NewNotificationNATSCtrl(conn nats.Connection, m monitoring.Monitor) (nats.Producer[Notification], error) {
    return nats.NewProducer(
        conn,
        m.Logger(),
        "notifications",           // Subject
        encodeNotificationProto,   // Encoder
    )
}

func encodeNotificationProto(ctx context.Context, n Notification) ([]byte, error) {
    protoMsg := &notificationv1.Notification{
        Category: string(n.Channel()),
        Level:    string(n.Level()),
        Message:  n.Message(),
        Data:     n.Data(),
    }
    return proto.Marshal(protoMsg)
}
```

**Generates fx module wiring:**
```go
// gen/notification_module.gen.go

func notificationFxModule() fx.Option {
    return fx.Module(
        "workspace:notifications",
        nats.NewProducerFx[Notification](NewNotificationNATSCtrl, fx.As(new(nats.Producer[Notification]))),
    )
}
```

**You just inject and use it:**
```go
// internal/some_usecase.go (YOUR CODE)

type someUsecase struct {
    notifier nats.Producer[Notification]  // Injected by fx
}

func (uc *someUsecase) DoSomething(ctx context.Context) error {
    // Publish notification
    return uc.notifier.Publish(ctx, newNotification("workspace.created", "Workspace was created"))
}
```

---

### NATS Consumers

**UI defines:**
```
Consumer: logs.strategy
  Subject: logs.strategy.>
  Handler: HandleLogEntry(LogEntry)
```

**Generates consumer constructor (uses kit nats.Consumer pattern):**
```go
// gen/logger_nats.gen.go

const loggerSubject = "logs.strategy.>"

func NewLoggerNATSConsumer(
    conn nats.Connection,
    handler nats.Handler[LogEntry],  // Your controller implements this
    m monitoring.Monitor,
) (nats.Consumer, error) {
    return nats.NewConsumer(
        conn,
        m.Logger(),
        loggerSubject,
        decodeLogEntry,   // Decoder
        handler,          // Your handler
    )
}

func decodeLogEntry(_ context.Context, msg *natsgo.Msg) (LogEntry, error) {
    var protoMsg logv1.LogEntry
    if err := proto.Unmarshal(msg.Data, &protoMsg); err != nil {
        return nil, err
    }
    return newLogEntry(
        time.UnixMilli(protoMsg.TimestampUnixMs),
        protoMsg.Labels,
        protoMsg.Line,
    ), nil
}
```

**Generates fx module wiring:**
```go
// gen/logger_module.gen.go

func loggerFxModule() fx.Option {
    return fx.Module(
        "logger",
        fx.Provide(
            fx.Annotate(
                NewLogController,
                fx.As(new(LogController)),
                fx.As(new(nats.Handler[LogEntry])),  // Dual registration
            ),
        ),
        nats.NewConsumerFx[LogEntry](NewLoggerNATSConsumer, "logger"),
    )
}
```

**You implement the handler (controller implements nats.Handler[T]):**
```go
// internal/log_controller.go (YOUR CODE)

type logController struct {
    uc LogUsecase
}

func NewLogController(uc LogUsecase) *logController {
    return &logController{uc: uc}
}

// Handle implements nats.Handler[LogEntry]
func (c *logController) Handle(ctx context.Context, entry LogEntry) error {
    return c.uc.Store(ctx, entry)
}
```

---

## What Gets Generated vs What You Write

| Component | Generated? | Source |
|-----------|------------|--------|
| Controller interface | Yes | Spec (UI - Resource Card methods) |
| REST transport (handlers) | Yes | Spec (UI - Endpoints) |
| gRPC .proto | Yes | Spec (UI) |
| NATS producer impl | Yes | Spec (UI) |
| NATS consumer interface | Yes | Spec (UI) |
| DB Migrations | Yes | Schema editor (separate concern) |
| **Controller impl** | **No** | You write (implements generated interface) |
| **Repository impl** | **No** | You write (your choice of tables/queries) |
| **Usecase impl** | **No** | You write (business logic) |
| **NATS consumer impl** | **No** | You write |
| **DTOs** | **Partial** | Generated skeleton, you customize |

**Key insight:** The controller interface is generated from the Resource Card methods you define in the UI. The controller implementation you write does NOT know about database tables - it delegates to the repository layer.

---

## The Spec File

```yaml
# api/forge.spec.yaml
version: "1"
service: workspace-service
package: github.com/dosanma1/trading-bot/backend/services/workspace

resources:
  Workspace:
    basePath: /workspaces
    version: v1

    # Controller interface methods (defined in Resource Card)
    methods:
      - name: Create
        params: [{ name: ws, type: Workspace }]
        returns: Workspace
      - name: Get
        params: [{ name: id, type: string }]
        returns: Workspace
      - name: List
        params: [{ name: opts, type: "...query.Option" }]
        returns: "[]Workspace"
      - name: GetByName
        params: [{ name: name, type: string }]
        returns: Workspace
      - name: Delete
        params: [{ name: id, type: string }]
        returns: error

    # Spec-first: define endpoints (transport layer)
    endpoints:
      - method: GET
        path: /:id
        handler: GetWorkspace
        response: Workspace

      - method: POST
        path: /
        handler: CreateWorkspace
        request: Workspace
        response: Workspace

      - method: GET
        path: /
        handler: ListWorkspaces
        response: Workspace[]

      - method: GET
        path: /by-name/:name
        handler: GetWorkspaceByName
        params:
          - name: name
            type: string
        response: Workspace

      - method: DELETE
        path: /:id
        handler: DeleteWorkspace

infrastructure:
  database: workspace-db

transports:
  grpc:
    services:
      - name: TradingService
        methods:
          - name: ExecuteOrder
            request: ExecuteOrderRequest
            response: ExecuteOrderResponse

  nats:
    producers:
      - stream: order.events
        subject: order.created
        message: OrderCreatedEvent

    consumers:
      - stream: market.ticks
        subject: market.tick.*
        handler: HandleMarketTick
        message: MarketTickEvent
```

---

## Validation: Spec = Contract

When you click "Generate":

1. **Generates interfaces** from spec
2. **Your code must implement them**
3. **Compile fails if you don't**

```
Spec defines:
  GET /workspaces/by-name/:name → GetWorkspaceByName(name)

Generated interface:
  type WorkspaceController interface {
      GetWorkspaceByName(ctx context.Context, name string) (Workspace, error)
  }

Your implementation:
  ✓ Implements GetWorkspaceByName → Compiles
  ✗ Missing GetWorkspaceByName   → Compile error: "does not implement"
  ✓ Extra methods you add        → Compiles, but not exposed (not in spec)
```

---

## Open Questions

### Database Schema Editor
1. Build our own in Angular?
2. Embed Supabase Studio?
3. Simple table builder component?

### Schema Storage
1. Store in file (like Prisma schema)?
2. Introspect from live DB?
3. Both?

### Request/Response Bodies
1. Auto-derive from resource fields?
2. Define custom DTOs in UI?
3. Reference other resources?

---

## Phase Tasks

### Phase 0: Database Schema Editor
- [ ] 0.1 Research: Build vs embed (Supabase Studio, custom Angular)
- [ ] 0.2 Design schema editor UI (tables, columns, types, constraints)
- [ ] 0.3 Implement migration generation from schema changes
- [ ] 0.4 Integrate with existing `cmd/migrator`

### Phase 1: Spec Format & Parser
- [ ] 1.1 Define spec schema (resources, endpoints, methods, handlers)
- [ ] 1.2 Create Go structs for spec model
- [ ] 1.3 Implement YAML parser/writer
- [ ] 1.4 Validate spec (required fields, valid types, references)

### Phase 2: Interface Generator
- [ ] 2.1 Generate controller interface from Resource Card methods (spec)
- [ ] 2.2 Generate transport handlers from spec endpoints
- [ ] 2.3 Generate gRPC .proto from spec
- [ ] 2.4 Generate NATS producer/consumer interfaces from spec

### Phase 3: Transport Generator
- [ ] 3.1 Generate REST handlers that call controller interface
- [ ] 3.2 Generate gRPC server that calls interface
- [ ] 3.3 Generate NATS consumer wiring
- [ ] 3.4 Generate NATS producer implementation

### Phase 4: Canvas Level 1 - Architecture Overview
- [ ] 4.1 Add ngx-vflow canvas with zoom/pan
- [ ] 4.2 Implement node palette (Service, Database, Message Broker, etc.)
- [ ] 4.3 Implement node creation forms
- [ ] 4.4 Implement edge drawing between nodes
- [ ] 4.5 Implement double-click to drill down

### Phase 5: Canvas Level 2 - Service Internals (Endpoint Designer)
- [ ] 5.1 Implement drill-down navigation (double-click service → zoom in)
- [ ] 5.2 Implement transport groups (HTTP, gRPC, NATS)
- [ ] 5.3 Implement `[+ Add Resource]` button and form
- [ ] 5.4 Implement resource cards (show controller methods)
- [ ] 5.4.1 Implement `[+ Add Method]` button and form
- [ ] 5.5 Implement `[+ Add Endpoint]` button and form
- [ ] 5.6 Implement endpoint nodes inside transport groups
- [ ] 5.7 Implement arrow drawing from endpoint to resource
- [ ] 5.8 Implement `[← Back to Canvas]` navigation

### Phase 6: Two-Way Sync
- [ ] 6.1 UI changes → update spec file
- [ ] 6.2 Watch spec file → update UI
- [ ] 6.3 Validate spec on change
- [ ] 6.4 Show validation errors in UI

### Phase 7: Code Generation Integration
- [ ] 7.1 "Generate" button in UI
- [ ] 7.2 Show generation progress
- [ ] 7.3 Show compile errors if interface not implemented
- [ ] 7.4 Auto-regenerate on spec change (optional)

---

## Reference Files

**Existing patterns:**
- [workspace.go](../../../trading-bot/backend/services/workspace/internal/workspace.go)
- [workspace_transport.go](../../../trading-bot/backend/services/workspace/internal/workspace_transport.go)

**Key insight from transport:**
```go
func (c workspaceRESTCtrl) Version() string   { return "v1" }
func (c workspaceRESTCtrl) BasePath() string  { return "/workspaces" }
func (c workspaceRESTCtrl) Endpoints() []rest.Endpoint { /* ... */ }
```

Each resource has its own controller with version, basePath, and endpoints.
