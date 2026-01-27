# Forge Framework - Core Features

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-01-26

---

## F1: Visual Node Editor

**Description**: Drag-and-drop interface for designing service architecture using ngx-vflow.

**User Stories**:

- As a developer, I can drag Entity nodes to define domain models
- As a developer, I can connect Entity to REST Endpoint to expose CRUD operations
- As a developer, I can see exposed functions from my manual code as available nodes

**Acceptance Criteria**:

- [ ] Node palette with all available node types
- [ ] Drag and drop nodes onto canvas
- [ ] Connect nodes with typed edges
- [ ] Property panel for node configuration
- [ ] Validation feedback for invalid configurations
- [ ] Undo/redo support

---

## F2: Code Generation

**Description**: Generate production-ready Go code from visual graph definition.

**User Stories**:

- As a developer, I can generate all boilerplate code from my visual design
- As a developer, generated code follows Forge Kit patterns exactly
- As a developer, I can regenerate code without losing manual changes

**Acceptance Criteria**:

- [ ] Generate entity.go with Repository/Usecase/Controller
- [ ] Generate transport.go with JSON:API DTOs
- [ ] Generate module.go with Fx wiring
- [ ] Generate BUILD.bazel files
- [ ] Generate .mockery.yaml
- [ ] Include "DO NOT EDIT" headers
- [ ] Preserve \_custom.go files on regeneration

---

## F3: AST Function Discovery

**Description**: Automatically discover exported functions from manual code and expose them as nodes.

**User Stories**:

- As a developer, my exported functions appear in the node palette automatically
- As a developer, I can exclude functions with //forge:ignore

**Acceptance Criteria**:

- [ ] Scan all .go files in project
- [ ] Extract exported functions and methods
- [ ] Parse parameter types and return types
- [ ] Respect //forge:ignore comments
- [ ] Generate node UI from function signature
- [ ] Support context.Context as first parameter

---

## F4: OpenAPI Auto-Generation

**Description**: Automatically generate OpenAPI 3.0 specs from entity/endpoint definitions.

**User Stories**:

- As a developer, I get Swagger documentation with zero effort
- As a developer, I can access Swagger UI at /docs

**Acceptance Criteria**:

- [ ] Generate openapi.yaml from graph definition
- [ ] Entity fields become Schema definitions
- [ ] REST endpoints become Path operations
- [ ] Validation rules become Schema constraints
- [ ] Serve Swagger UI at /docs in development

---

## F5: SOPS Integration

**Description**: Include SOPS configuration for secure secret management by default.

**User Stories**:

- As a developer, my project is production-ready with encrypted secrets
- As a developer, I have example secret files to follow

**Acceptance Criteria**:

- [ ] Generate .sops.yaml configuration
- [ ] Generate secrets/dev.enc.yaml example
- [ ] Generate config loading with SOPS support

---

## F6: Local Development Enhancements

**Description**: Features that leverage the local environment to improve developer velocity.

**User Stories**:

- As a developer, I can click a node and open the corresponding file in VS Code (`code` URL scheme or CLI)
- As a developer, I can see the `make dev` build logs streamed directly in the Studio Dashboard
- As a developer, filesystem changes are reflected instantly (Hot Reload)

**Acceptance Criteria**:

- [ ] Implement `x-scheme` or CLI-based file opening from Studio
- [ ] Stream stdout/stderr from the Daemon to the UI via WebSocket
- [ ] Watch for file changes and auto-refresh the graph

**Related Specifications:**

- [Overview](00-overview.md)
- [Node System](03-node-system.md)
- [Code Generation](04-code-generation.md)
- [UI Design](07-ui-design.md)
