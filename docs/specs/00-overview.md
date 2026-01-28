# Forge Framework - Overview

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-01-28

---

## Executive Summary

Forge Framework is a visual no-code backend development platform that generates production-ready Go code. Inspired by Unreal Engine's Blueprint system, Forge allows developers to visually design backend services using a drag-and-drop node editor while maintaining the ability to write complex domain logic in code.

**Key Value Propositions:**

- **Desktop-First Experience**: Delivered as a native **Wails-based application** for macOS, Windows, and Linux.
- **Supreme Developer Experience**: Supabase-inspired Studio with dark mode, dashboard analytics, and clean typography.
- **Native OS Integration**: Native "Start Screen" to manage local projects and native OS dialogs for folder selection.
- **Hybrid Workflow**: Visual "Shell" (Transports, Wiring) + Manual "Core" (Business Logic in pure Go)
- **Production-Ready Output**: Generate clean, tested, documented Go code following Clean Architecture
- **Framework Conventions**: Angular-style conventions with flexibility in project structure
- **Full Stack Generation**: REST (JSON:API), gRPC, NATS, migrations, tests, and deployment configs

---

## Problem Statement

### Current Pain Points

1. **Boilerplate Overhead**: Backend services require significant boilerplate (DTOs, transports, migrations, tests)
2. **Inconsistent Patterns**: Teams often implement patterns differently across services
3. **Steep Learning Curve**: New developers must learn multiple patterns (Clean Architecture, Fx, JSON:API)
4. **Slow Iteration**: Changes require updating multiple files (entity, transport, migration, tests)
5. **Configuration Complexity**: Bazel builds, mockery, SOPS, Helm charts need expertise

### Why Visual Development?

- **Faster Prototyping**: Visually design service structure before writing business logic
- **Pattern Enforcement**: Impossible to deviate from established patterns
- **Documentation by Design**: Visual diagrams serve as living documentation
- **Lower Barrier**: Junior developers can contribute to infrastructure code
- **Discoverability**: See exposed functions from manual code as available nodes

---

## Goals & Non-Goals

### Goals

| Goal    | Description                                                     |
| ------- | --------------------------------------------------------------- |
| **G1**  | Generate production-ready Go code following Forge Kit patterns  |
| **G2**  | Provide visual node editor for designing service infrastructure |
| **G3**  | Support hybrid development (generated + manual code)            |
| **G4**  | Enforce JSON:API spec for all REST endpoints                    |
| **G5**  | Enforce proto marshalling for all NATS messaging                |
| **G6**  | Auto-generate OpenAPI/Swagger documentation                     |
| **G7**  | Include SOPS configuration by default                           |
| **G8**  | Generate Bazel BUILD files and mockery configuration            |
| **G9**  | Scan manual code via AST to expose functions as nodes           |
| **G10** | Provide a global "Start Screen" for managing multiple projects  |
| **G11** | Deliver a premium "Supabase-like" dashboard experience          |

### Non-Goals

| Non-Goal | Reason                                                               |
| -------- | -------------------------------------------------------------------- |
| **NG1**  | General-purpose workflow automation (focus on backend services only) |
| **NG2**  | Visual coding for business logic (that stays in manual code)         |
| **NG3**  | Real-time collaboration (Phase 2+ feature)                           |
| **NG4**  | Multi-language support (Go only for now)                             |
| **NG5**  | Cloud deployment management (use existing infrastructure)            |

---

## Target Users

### Primary Users

**Backend Developers**

- Experienced with Go, familiar with Clean Architecture
- Want to reduce boilerplate and enforce patterns
- Need to integrate generated code with complex domain logic

### Secondary Users

**DevOps Engineers**

- Configure deployment pipelines
- Benefit from generated Helm charts and Skaffold configs

**Junior Developers**

- Can contribute to service infrastructure without deep pattern knowledge
- Visual interface helps understand service structure

---

## Success Metrics

| Metric                       | Target              | Measurement                               |
| ---------------------------- | ------------------- | ----------------------------------------- |
| **Code Generation Accuracy** | 100%                | Generated code compiles without errors    |
| **Pattern Compliance**       | 100%                | Generated code matches Forge Kit patterns |
| **Time Savings**             | 70% reduction       | Time to create CRUD service vs manual     |
| **Adoption**                 | 5 internal services | Services using Forge for generation       |
| **Developer Satisfaction**   | 8/10                | Survey score                              |

---

## Risks & Mitigations

| Risk                              | Impact | Probability | Mitigation                            |
| --------------------------------- | ------ | ----------- | ------------------------------------- |
| **Template complexity**           | High   | Medium      | Start with simple patterns, iterate   |
| **AST parsing edge cases**        | Medium | Medium      | Extensive testing, fallback to manual |
| **ngx-vflow limitations**         | Medium | Low         | Evaluate alternatives early           |
| **Breaking changes in patterns**  | High   | Low         | Strong versioning, migration tools    |
| **Performance with large graphs** | Medium | Low         | Lazy loading, virtualization          |

---

## Appendix

### A. Reference Files from trading-bot

| File                    | Pattern            | Location                                                      |
| ----------------------- | ------------------ | ------------------------------------------------------------- |
| Fx module composition   | Module wiring      | `backend/services/trading/internal/module.go`                 |
| Repo/Usecase/Controller | Clean Architecture | `backend/services/trading/internal/workflow.go`               |
| JSON:API DTO pattern    | REST transport     | `backend/services/trading/internal/workflow_transport.go`     |
| NATS producer           | Messaging          | `backend/services/trading/internal/notification_transport.go` |
| NATS consumer           | Messaging          | `backend/services/logger/internal/logger_transport.go`        |

### B. Technology Stack Summary

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| Frontend Framework | Angular 18+ (bundled with Wails)          |
| App Framework      | Wails v3                                  |
| Node Editor        | ngx-vflow                                 |
| State Management   | Angular Signals                           |
| Styling            | TailwindCSS + OKLCH colors                |
| Code Preview       | Monaco Editor                             |
| Backend Language   | Go 1.24+                                  |
| DI Framework       | Uber Fx                                   |
| Storage            | File-based (forge.json) - **NO DATABASE** |
| Router             | Chi (go-chi/chi)                          |
| CLI Framework      | Cobra                                     |
| Template Engine    | Go text/template                          |
| Build System       | Bazel                                     |

### C. Glossary

| Term                   | Definition                                                    |
| ---------------------- | ------------------------------------------------------------- |
| **Node**               | Visual representation of a component (Entity, Endpoint, etc.) |
| **Edge**               | Connection between nodes representing relationships           |
| **Graph**              | Collection of nodes and edges defining service architecture   |
| **Forge Kit**          | Existing SDK with monitoring, transports, etc.                |
| **Clean Architecture** | Pattern with Repository/Usecase/Controller layers             |
| **JSON:API**           | REST specification for JSON responses                         |
| **Fx**                 | Uber's dependency injection framework for Go                  |

---

**Related Specifications:**

- [Architecture](01-architecture.md)
- [Features](02-features.md)
- [Node System](03-node-system.md)
- [Code Generation](04-code-generation.md)
- [JSON Schemas](05-json-schemas.md)
- [API Specification](06-api-spec.md)
- [UI Design](07-ui-design.md)
- [Operations](08-operations.md)
- [Roadmap](09-roadmap.md)
