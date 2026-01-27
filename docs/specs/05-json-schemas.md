# Forge Framework - JSON Schemas

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-01-26

---

## forge.json Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://forge.dev/schemas/v1/forge-project.json",
  "title": "Forge Project Configuration",
  "type": "object",
  "required": ["version", "name", "graph"],
  "properties": {
    "$schema": {
      "type": "string",
      "description": "JSON Schema reference"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Forge schema version"
    },
    "forgeVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Minimum Forge CLI version required"
    },
    "name": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Project name (kebab-case)"
    },
    "module": {
      "type": "string",
      "description": "Go module path"
    },
    "graph": {
      "$ref": "#/definitions/Graph"
    },
    "settings": {
      "$ref": "#/definitions/Settings"
    }
  },
  "definitions": {
    "Graph": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": { "$ref": "#/definitions/Node" }
        },
        "edges": {
          "type": "array",
          "items": { "$ref": "#/definitions/Edge" }
        }
      }
    },
    "Node": {
      "type": "object",
      "required": ["id", "type", "position", "data"],
      "properties": {
        "id": { "type": "string" },
        "type": {
          "type": "string",
          "enum": [
            "entity",
            "rest-endpoint",
            "grpc-service",
            "nats-producer",
            "nats-consumer",
            "websocket"
          ]
        },
        "position": {
          "type": "object",
          "properties": {
            "x": { "type": "number" },
            "y": { "type": "number" }
          }
        },
        "data": { "type": "object" }
      }
    },
    "Edge": {
      "type": "object",
      "required": ["id", "source", "target", "type"],
      "properties": {
        "id": { "type": "string" },
        "source": { "type": "string" },
        "target": { "type": "string" },
        "type": {
          "type": "string",
          "enum": ["data_flow", "dependency", "reference", "event"]
        }
      }
    },
    "Settings": {
      "type": "object",
      "properties": {
        "sops": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "kmsArn": { "type": "string" }
          }
        },
        "openapi": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "title": { "type": "string" },
            "version": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

## Node Type Schemas

### Entity Node Data Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://forge.dev/schemas/v1/nodes/entity.json",
  "title": "Entity Node Data",
  "type": "object",
  "required": ["name", "resourceType", "fields"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[A-Z][a-zA-Z0-9]*$",
      "description": "Entity name (PascalCase)"
    },
    "resourceType": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "JSON:API resource type (kebab-case)"
    },
    "tableName": {
      "type": "string",
      "description": "Override database table name"
    },
    "fields": {
      "type": "array",
      "items": { "$ref": "#/definitions/Field" }
    },
    "options": {
      "type": "object",
      "properties": {
        "softDelete": { "type": "boolean", "default": false },
        "timestamps": { "type": "boolean", "default": true }
      }
    }
  },
  "definitions": {
    "Field": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": { "type": "string" },
        "type": {
          "type": "string",
          "enum": ["string", "int", "int64", "float64", "bool", "uuid", "timestamp", "json", "decimal", "enum"]
        },
        "nullable": { "type": "boolean", "default": false },
        "unique": { "type": "boolean", "default": false },
        "defaultValue": {},
        "enumValues": {
          "type": "array",
          "items": { "type": "string" }
        },
        "validation": {
          "type": "object",
          "properties": {
            "required": { "type": "boolean" },
            "minLength": { "type": "integer" },
            "maxLength": { "type": "integer" },
            "min": { "type": "number" },
            "max": { "type": "number" },
            "pattern": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### REST Endpoint Node Data Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://forge.dev/schemas/v1/nodes/rest-endpoint.json",
  "title": "REST Endpoint Node Data",
  "type": "object",
  "required": ["entityRef", "basePath"],
  "properties": {
    "entityRef": {
      "type": "string",
      "description": "Reference to Entity node ID"
    },
    "basePath": {
      "type": "string",
      "pattern": "^/[a-z][a-z0-9-/]*$",
      "description": "Base path for endpoints"
    },
    "version": {
      "type": "string",
      "default": "v1"
    },
    "operations": {
      "type": "object",
      "properties": {
        "create": { "$ref": "#/definitions/Operation" },
        "get": { "$ref": "#/definitions/Operation" },
        "list": { "$ref": "#/definitions/Operation" },
        "patch": { "$ref": "#/definitions/Operation" },
        "delete": { "$ref": "#/definitions/Operation" }
      }
    },
    "deleteType": {
      "type": "string",
      "enum": ["soft", "hard"],
      "default": "soft"
    },
    "authentication": {
      "type": "boolean",
      "default": true
    },
    "customEndpoints": {
      "type": "array",
      "items": { "$ref": "#/definitions/CustomEndpoint" }
    }
  },
  "definitions": {
    "Operation": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "middleware": {
          "type": "array",
          "items": { "type": "string" }
        },
        "overrideHandler": { "type": "string" }
      }
    },
    "CustomEndpoint": {
      "type": "object",
      "required": ["method", "path", "handler"],
      "properties": {
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]
        },
        "path": { "type": "string" },
        "handler": { "type": "string" },
        "middleware": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

---

**Related Specifications:**
- [Node System](03-node-system.md)
- [API Specification](06-api-spec.md)
- [Code Generation](04-code-generation.md)
