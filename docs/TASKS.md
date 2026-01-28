# Forge Studio - Phased Implementation Roadmap

This document outlines the implementation status of Forge Studio, organized into development phases.

## Phase 1: Foundation & Desktop Infrastructure

Focus: Core CLI, Wails desktop integration, and single-binary distribution.

- [x] **CLI Core Extensions**
  - [x] Add `forge studio` command
  - [x] Daemon bootstrap logic (`forge-api` integration)
  - [x] Support `forge studio .` for direct folder opening
- [x] **Desktop Integration (Wails v3)**
  - [x] Single binary bundling with `embed`
  - [x] Native OS dialogs for file system access
  - [x] Project management service bindings
- [x] **Project Management API**
  - [x] Persistent storage for `recent_projects.json` in `~/.forge/`
  - [x] Project discovery and validation logic
  - [x] `ListProjects`, `OpenProject`, and `CreateProject` operations

## Phase 2: Studio UI & Workspace Management

Focus: Providing a premium "VSCode-style" entry and "Supabase-style" dashboard.

- [x] **Start Screen Implementation**
  - [x] VSCode-style recent projects list
  - [x] Dashboard Layout shell
  - [x] Integration with native directory pickers
- [ ] **Workspace Refinement**
  - [ ] Add "Clone Repo" native modal/flow
  - [ ] Support project lazy-loading (unload/load project context)
  - [ ] Implement `GlobalState` (Signal Store) for workspace sync
  - [x] SPA routing with 404 redirection to `index.html`

## Phase 3: Generator Engine & Templates Refactor

Focus: Syncing with `trading-bot` patterns and ensuring clean code generation.

- [x] **Headless Initialization**
  - [x] Implement `forge init` for API usage
  - [x] Expose `generator` package for direct daemon import
- [ ] **Templates Modernization**
  - [ ] Update templates to match `trading-bot` (Clean Architecture)
  - [ ] `entity.go.tmpl` (Interface-first definitions)
  - [ ] `transport_rest.go.tmpl` (Kit handlers integration)
  - [ ] `module.go.tmpl` (Fx wiring)
  - [ ] Ensure frontend templates link to `ts/ui` shared library

## Phase 4: Core Studio Features (The Dashboard)

Focus: Visual editors for architecture and data.

- [ ] **Architecture View (The Graph)**
  - [ ] `ngx-vflow` wrapper implementation
  - [ ] Node palette (Entities, Endpoints, Transports)
  - [ ] Interactive property panels
- [ ] **Data Models View**
  - [ ] Table-based schema editor
  - [ ] Entity relationship management
- [ ] **API Operations & DX**
  - [ ] Embedded Swagger/OpenAPI browser
  - [ ] Local log streaming (Pipe stdout/stderr to UI)
  - [ ] Native editor integration (`Open in Code`)

## Phase 5: Verification & Production Readiness

Focus: Quality assurance and final refinements.

- [ ] **Functional Testing**
  - [ ] Empty folder initialization flow
  - [ ] Existing project loading
  - [ ] Generation cycle validation
- [ ] **Production Polish**
  - [ ] Dark mode variables strict enforcement
  - [ ] Deployment configuration generation (Helm, Cloud Run)
