# Forge Framework - Node System Specification

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-01-26

---

## Node Categories

| Category        | Nodes                                                                | Purpose                           |
| --------------- | -------------------------------------------------------------------- | --------------------------------- |
| **Resources**   | Entity, Relationship                                                 | Define domain models              |
| **Transports**  | REST Endpoint, gRPC Service, NATS Producer, NATS Consumer, WebSocket | API layer                         |
| **Persistence** | Repository, Cache                                                    | Data access                       |
| **Exposed**     | (Auto-discovered)                                                    | Manual code functions to be wired |

---

## Entity Node

**Purpose**: Define a domain entity with fields and relationships.

**Configuration**:

```typescript
interface EntityNodeConfig {
  id: string; // Unique node ID
  name: string; // Entity name (PascalCase), e.g., "User"
  resourceType: string; // JSON:API type (kebab-case), e.g., "users"
  tableName?: string; // Override table name (default: snake_case of name)

  fields: FieldConfig[];
  relationships: RelationshipConfig[];

  options: {
    softDelete: boolean; // Enable deleted_at field
    timestamps: boolean; // Enable created_at, updated_at
  };
}

interface FieldConfig {
  name: string; // Field name (camelCase)
  type: FieldType;
  nullable: boolean;
  unique: boolean;
  defaultValue?: any;
  enumValues?: string[]; // For enum types

  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

type FieldType =
  | "string"
  | "int"
  | "int64"
  | "float64"
  | "bool"
  | "uuid"
  | "timestamp"
  | "json"
  | "decimal"
  | "enum";
```

---

## REST Endpoint Node

**Purpose**: Expose entity via JSON:API compliant REST endpoints.

**Configuration**:

```typescript
interface RESTEndpointNodeConfig {
  id: string;
  entityRef: string; // Reference to Entity node ID

  basePath: string; // e.g., "/users"
  version: string; // e.g., "v1"

  operations: {
    create: OperationConfig; // Standard CRUD or Custom Handler
    get: OperationConfig;
    list: OperationConfig;
    patch: OperationConfig;
    delete: OperationConfig;
  };

  deleteType: "soft" | "hard";
  authentication: boolean;

  // Additional custom routes
  customEndpoints?: CustomEndpointConfig[];
}

interface OperationConfig {
  enabled: boolean;
  middleware?: string[]; // List of middleware hooks
  overrideHandler?: string; // Reference to exposed manual function (bypasses generated CRUD)
}

interface CustomEndpointConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // e.g., "/:id/activate"
  handler: string; // Reference to exposed function
  middleware?: string[];
}
```

---

## gRPC Service Node

**Purpose**: Expose entity via gRPC service.

**Configuration**:

```typescript
interface GRPCServiceNodeConfig {
  id: string;
  serviceName: string; // e.g., "UserService"
  package: string; // e.g., "user.v1"

  methods: GRPCMethodConfig[];
}

interface GRPCMethodConfig {
  name: string; // e.g., "GetUser"
  type: "unary" | "server_stream" | "client_stream" | "bidirectional";
  requestEntity?: string; // Entity reference for auto-generated request
  responseEntity?: string; // Entity reference for auto-generated response
  handler?: string; // Reference to exposed function (for custom logic)
}
```

---

## NATS Producer Node

**Purpose**: Publish messages to NATS stream with proto marshalling.

**Configuration**:

```typescript
interface NATSProducerNodeConfig {
  id: string;
  name: string; // e.g., "NotificationProducer"
  subject: string; // NATS subject, e.g., "notifications"

  entityRef?: string; // Entity to publish
  protoPackage: string; // e.g., "notification.v1"
  protoMessage: string; // e.g., "Notification"
}
```

---

## NATS Consumer Node

**Purpose**: Subscribe to NATS stream and process messages.

**Configuration**:

```typescript
interface NATSConsumerNodeConfig {
  id: string;
  name: string;
  subject: string; // NATS subject with wildcards, e.g., "logs.>"
  queue: string; // Queue group for load balancing

  protoPackage: string;
  protoMessage: string;
  handler: string; // Reference to exposed function: func(ctx, msg *pb.Message) error

  retryPolicy: {
    maxRetries: ConfigurableProperty; // e.g. 3 or ENV_VAR
    backoff: "linear" | "exponential";
    initialDelay: string; // e.g., "1s"
  };
}
```

---

## Edge Types

| Edge Type    | Description                             | Visual           |
| ------------ | --------------------------------------- | ---------------- |
| `data_flow`  | Data flows from source to target        | Solid line       |
| `dependency` | Target depends on source (Fx injection) | Dashed line      |
| `reference`  | Foreign key relationship                | Arrow with label |
| `event`      | Event/trigger connection                | Dotted line      |

---

## Configuration Properties

Nodes can reference "Configurable Properties" (Env Vars) instead of hardcoded strings.

```typescript
interface ConfigurableProperty {
  value: string; // Default value
  envVar: string; // e.g. "NATS_SUBJECT"
  description: string;
}
```

---

**Related Specifications:**
- [Overview](00-overview.md)
- [Features](02-features.md)
- [JSON Schemas](05-json-schemas.md)
- [UI Design](07-ui-design.md)
