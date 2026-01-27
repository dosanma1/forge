# Forge Framework - Roadmap

**Version:** 1.1.0
**Status:** Draft
**Last Updated:** 2026-01-26

---

## Implementation Phases

### Phase 0: Core Architecture (MUST-HAVE - Encore-Inspired)

**forge-cli repo:**
- [x] Create public `pkg/generator` API for external consumption
- [ ] Implement Builder Interface for pluggable generators
- [ ] Create `pkg/xos` package for atomic file operations
- [ ] Define proto schemas for daemon RPC

**forge repo:**
- [x] Direct module import (replace exec.Command with direct generator calls)
- [x] Single replace directive in go.mod
- [ ] Implement streaming responses for long operations
- [ ] Add WebSocket hub for real-time updates

**Deliverables:**
- Builder interface implemented
- Atomic file writes working
- forge-cli importable as module

---

### Phase 1: Foundation

**forge repo:**
- [ ] Create PRD document
- [ ] Set up Angular project structure
- [ ] Configure ngx-vflow integration
- [ ] Create basic node components

**forge-cli repo:**
- [ ] Define all JSON Schemas
- [ ] Implement Go AST scanner
- [ ] Create template engine
- [ ] Add `forge studio` command skeleton
- [ ] Implement Builder interface for Go service generator

**Deliverables:**
- Empty Angular app with ngx-vflow
- Working AST scanner that extracts functions
- JSON Schema documentation
- Builder interface with Go service implementation

---

### Phase 2: Core Code Generation

**forge-cli repo:**
- [ ] Entity template → entity.go
- [ ] REST transport template → transport.go
- [ ] Module template → module.go
- [ ] Migration template → migration.sql
- [ ] BUILD.bazel template
- [ ] OpenAPI generator
- [ ] SOPS configuration generator

**Deliverables:**
- Working `forge generate` command
- Generated code compiles and follows patterns
- OpenAPI spec generated automatically

---

### Phase 3: Visual Editor

**forge repo:**
- [ ] Entity node with field editor
- [ ] REST endpoint node
- [ ] Property panel
- [ ] Graph serialization
- [ ] Exposed functions browser
- [ ] Code preview pane (Monaco)

**Deliverables:**
- Functional visual editor
- Can design simple CRUD service
- Code preview updates in real-time

---

### Phase 4: Integration & Daemon Mode

- [ ] Connect Studio to code generation
- [ ] Project persistence
- [ ] **Implement Forge Daemon** (gRPC over Unix socket)
- [ ] **File watching with fsnotify**
- [ ] **Hot reload when forge.json changes**
- [ ] **WebSocket hub for real-time Studio updates**
- [ ] Error handling and validation feedback
- [ ] Streaming output for long operations

**Deliverables:**
- End-to-end workflow working
- Can design → generate → build → run
- Daemon mode with hot reload
- Real-time progress in Studio UI

---

### Phase 5: Advanced Transports

- [ ] gRPC service node
- [ ] Proto file generation
- [ ] NATS producer/consumer nodes
- [ ] Module composition (Fx wiring)

**Deliverables:**
- Full transport support
- Generated services match trading-bot patterns

---

### Phase 6: Testing & Versioning

- [ ] Test helper generation
- [ ] Golden file test support
- [ ] Schema versioning system
- [ ] Migration tooling

**Deliverables:**
- Generated tests pass
- Schema migration works

---

### Phase 7: Polish

- [ ] Helm chart generation
- [ ] Skaffold integration
- [ ] Documentation
- [ ] Bug fixes

**Deliverables:**
- Production-ready release
- Complete documentation

---

## Future Horizons

These features represent the long-term vision for Forge.

### Developer Experience

#### 1. Live Flow Debugging
- **Visual Tracing**: Nodes light up as requests/messages pass through
- **Packet Inspection**: Click on a wire to see the last payload

#### 2. Instant Mock Server
- **Zero-Code Prototyping**: Right-click an Entity → "Mock CRUD"
- **Immediate Feedback**: In-memory server for frontend integration

#### 3. AI Copilot ("Text-to-Graph")
- **Prompt**: "Create a billing service with Invoice entities..."
- **Action**: Generates corresponding nodes and wiring

#### 4. Interactive API Client
- **Built-in Postman**: Right-click an Endpoint → "Test Request"
- **Context Aware**: Pre-fills JSON bodies from Entity schema

---

### Architecture & Visualization

#### 5. Service Mesh Visualization
- **Monorepo Awareness**: "World View" showing service connections
- **Ghost Nodes**: Read-only nodes for external services

#### 6. Visual "Blast Radius" Analysis
- **Impact Analysis**: Changing a field highlights affected components
- **Pre-Compile Safety**: See what breaks before saving

#### 7. "Living" Architecture Diagrams
- **Always-Up-To-Date**: Export Mermaid/PlantUML diagrams
- **Documentation**: Embed live diagram links in README

---

### Testing & Reliability

#### 8. One-Click Load Testing
- **Stress Test**: Generate k6 scripts from endpoint definitions
- **Quick Validation**: Burst test directly from the editor

#### 9. Visual Chaos Nodes
- **Resilience Testing**: Drag "Latency" or "Error" nodes onto wires
- **Failover Verification**: Inject delays/errors to test retries

#### 10. Visual Pprof Integration
- **Performance Profiling**: Connect to running service's pprof
- **Visual Heatmaps**: See CPU/Memory hotspots on nodes

---

### Collaboration & Governance

#### 11. Real-Time Multiplayer
- **Collaborative Design**: "Figma for Backend" - live cursors
- **Pair Architecture**: Design systems together in real-time

#### 12. Governance & PII Enforcement
- **Compliance Guardrails**: Tag fields as `[PII]` or `[Secret]`
- **Visual Blocking**: Prevent connecting sensitive data to insecure endpoints

#### 13. Visual RBAC Policy Builder
- **Visual Authorization**: Connect "Role" nodes to Endpoints
- **Auto-Config**: Generate middleware or OPA policies

#### 14. Visual Merge Conflict Resolution
- **Git Awareness**: Detect conflicts in forge.json
- **Three-Way Merge**: Visual resolution of node/wire conflicts

---

### DevOps Integration

#### 15. Visual Contract Verification
- **Safety**: Detect schema mismatches across services
- **Visual Alert**: "Broken wires" in Service Mesh view

#### 16. Webhook Tunneling
- **Local Dev**: Right-click endpoint → "Expose to Internet"
- **Integration**: Temporary public URL for webhook testing

#### 17. Cost & Resource Estimator
- **Sizing**: Estimate CPU/RAM based on node types
- **Budgeting**: Rough cost estimate for infrastructure

#### 18. Data Seeding Node
- **Test Data**: Define JSON datasets within a "Seeder" node
- **One-Click Populate**: Wipe and re-seed local database

#### 19. Integrated "IDE" Panel
- **Log Streamer**: View structured logs in bottom panel
- **Git Integration**: Status bar with branch, dirty files, quick-commit

---

**Related Specifications:**
- [Overview](00-overview.md)
- [Features](02-features.md)
- [Architecture](01-architecture.md)
