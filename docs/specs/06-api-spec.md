# Forge Framework - API Specification

**Version:** 1.1.0
**Status:** Active
**Last Updated:** 2026-01-28

---

## Overview

The Forge API operates primarily as a **Wails-based service set** that interacts with the filesystem. While it exposes some REST endpoints for the Studio frontend, most core operations are handled via direct Go bindings.

**Base URL (for REST)**: `http://localhost:8080/api`

---

### Project Management API

Used by the Studio Start Screen.

| Method | Endpoint           | Description                                       |
| ------ | ------------------ | ------------------------------------------------- |
| `GET`  | `/projects`        | List recent projects (LRU) from `~/.forge/config` |
| `POST` | `/projects/open`   | Open a specific folder path                       |
| `POST` | `/projects/create` | Create/Initialize a new project                   |
| `GET`  | `/projects/status` | Check if a project is currently loaded            |

**POST /api/global/open Request:**

```json
{
  "path": "/Users/dev/my-project"
}
```

**Response:**

```json
{
  "success": true,
  "projectFound": true,
  "message": "Project loaded successfully"
}
```

_Note: If `projectFound` is false, UI should prompt to initialize._

---

## Project API

Used when a project context is active.

### Status & Info

| Method | Endpoint         | Description                                   |
| ------ | ---------------- | --------------------------------------------- |
| `GET`  | `/project`       | Get current project metadata (name, version)  |
| `POST` | `/project/close` | Close current project (return to Global Mode) |

### Graph Operations

| Method | Endpoint         | Description                           |
| ------ | ---------------- | ------------------------------------- |
| `GET`  | `/project/graph` | Get full node graph from `forge.json` |
| `PUT`  | `/project/graph` | Save full node graph                  |

**GET /api/project/graph Response:**

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "entity",
      "position": { "x": 0, "y": 0 },
      "data": { "name": "User" }
    }
  ],
  "edges": []
}
```

### Code Generation

| Method | Endpoint            | Description             |
| ------ | ------------------- | ----------------------- |
| `POST` | `/project/generate` | Trigger code generation |

**Request Body (optional):**

```json
{
  "targets": ["entity", "transport", "module"],
  "dryRun": false
}
```

**Response:**

```json
{
  "success": true,
  "filesGenerated": ["internal/user.go", "internal/user_transport.go"],
  "warnings": []
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Path does not contain forge.json",
    "details": {
      "path": "/Users/dev/empty-folder"
    }
  }
}
```

**Common Error Codes:**

| Code                | HTTP Status | Description                        |
| ------------------- | ----------- | ---------------------------------- |
| `PROJECT_NOT_FOUND` | 404         | Project does not exist             |
| `INVALID_SCHEMA`    | 400         | forge.json fails schema validation |
| `GENERATION_FAILED` | 500         | Code generation encountered error  |
| `GIT_CLONE_FAILED`  | 500         | Failed to clone repository         |

---

**Related Specifications:**

- [Architecture](01-architecture.md)
- [JSON Schemas](05-json-schemas.md)
- [Code Generation](04-code-generation.md)
