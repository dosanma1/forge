# Forge Framework - Product Requirements Document

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-01-28
**Authors:** dosanma1

---

## Overview

Forge Framework is a visual no-code backend development platform that generates production-ready Go code. Delivered as a **Wails-based desktop application**, Forge allows developers to visually design backend services using a drag-and-drop node editor while maintaining the ability to write complex domain logic in code.

**Key Value Propositions:**

- **Visual Infrastructure**: Build backend wiring (API -> Service -> DB) through an intuitive node-based editor
- **Hybrid Workflow**: Visual "Shell" (Transports, Wiring) + Manual "Core" (Business Logic in pure Go)
- **Production-Ready Output**: Generate clean, tested, documented Go code following Clean Architecture
- **Framework Conventions**: Angular-style conventions with flexibility in project structure
- **Full Stack Generation**: REST (JSON:API), gRPC, NATS, migrations, tests, and deployment configs

---

## Specifications

This PRD has been divided into modular specifications for easier navigation and maintenance:

| Spec                                              | Title                      | Description                                                                            |
| ------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| [00-overview](specs/00-overview.md)               | **Overview**               | Executive summary, problem statement, goals, target users, success metrics, risks      |
| [01-architecture](specs/01-architecture.md)       | **System Architecture**    | Repository structure, **Wails-based Desktop App**, data flow, Encore-inspired patterns |
| [02-features](specs/02-features.md)               | **Core Features**          | Visual node editor, code generation, AST discovery, OpenAPI, SOPS integration          |
| [03-node-system](specs/03-node-system.md)         | **Node System**            | Node categories, Entity/REST/gRPC/NATS node specifications, edge types                 |
| [04-code-generation](specs/04-code-generation.md) | **Code Generation**        | Template system, generation pipeline, file headers, output structure                   |
| [05-json-schemas](specs/05-json-schemas.md)       | **JSON Schemas**           | forge.json schema, node data schemas (Entity, REST Endpoint)                           |
| [06-api-spec](specs/06-api-spec.md)               | **API Specification**      | Forge API endpoints, request/response formats, error handling                          |
| [07-ui-design](specs/07-ui-design.md)             | **UI Design**              | Studio layout, components, interaction patterns, visual design                         |
| [08-operations](specs/08-operations.md)           | **Operations & Extension** | Shell+Core architecture, custom code hooks, database evolution, extension points       |
| [09-roadmap](specs/09-roadmap.md)                 | **Roadmap**                | **Phase 0 (Encore-inspired)**, implementation phases, future horizons                  |

---

## Quick Links

### Getting Started

- [Overview & Goals](specs/00-overview.md#goals--non-goals)
- [Target Users](specs/00-overview.md#target-users)
- [Technology Stack](specs/00-overview.md#b-technology-stack-summary)

### Technical Reference

- [Repository Structure](specs/01-architecture.md#repository-structure)
- [Node System](specs/03-node-system.md)
- [JSON Schemas](specs/05-json-schemas.md)
- [API Endpoints](specs/06-api-spec.md)

### Development

- [Code Generation Pipeline](specs/04-code-generation.md#generation-pipeline)
- [Custom Code Hooks](specs/08-operations.md#custom-code-hooks--preservation)
- [Implementation Phases](specs/09-roadmap.md#implementation-phases)
- [Future Horizons](specs/09-roadmap.md#future-horizons)

---

## Contributing

When updating these specifications:

1. Edit the appropriate spec file in the `specs/` directory
2. Keep this index (`PRD.md`) updated if adding new specs
3. Maintain cross-references between related specs
4. Update the "Last Updated" date in modified files

---

_This document serves as an index to the full Forge Framework specification._
