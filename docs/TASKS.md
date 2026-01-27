# Forge Studio Implementation Tasks

## Documentation

- [x] Update `00-overview.md` with new Vision (Supabase/VSCode style)
- [x] Update `01-architecture.md` with Global Mode & Project Selector
- [x] Update `07-ui-design.md` with Start Screen & Dashboard Layouts
- [ ] Review `06-api-spec.md` for Global API endpoints (`/api/global/*`)

## CLI (`forge-cli`)

- [ ] Add `forge studio` command
  - [ ] Should start the daemon (`forge-api`)
  - [ ] Should open the browser at `localhost:4200`
  - [ ] Should support `forge studio .` (open current folder directly)
- [ ] Implement `forge init` (headless mode for API usage)
  - [ ] Ensure `forge-cli` exposes `generator` package for direct import by Daemon
  - [ ] Daemon MUST use `generator.NewServiceGenerator()` directly, NOT `exec.Command("forge")`
- [ ] **Templates Refactor (Sync with Reference)**
  - [ ] Update `forge-cli` templates to match `trading-bot` structure (Clean Architecture)
    - [ ] Add `entity.go.tmpl` (Interface definitions)
    - [ ] Add `transport_rest.go.tmpl` (Kit HTTP handlers)
    - [ ] Add `module.go.tmpl` (Fx wiring)
  - [ ] Ensure frontend templates link to `ts/ui` library

## Daemon (`forge-api`)

- [ ] **Bootstrap via Forge CLI**
  - [ ] Run `forge generate service api` (using updated templates)
  - [ ] Ensure `api` service is created in `forge/api` (not `backend/services`)
- [ ] Create `GlobalManager` service
  - [ ] Store `recent_projects.json` in user home dir (`~/.forge/`)
  - [ ] Implement `ListRecent()` and `AddRecent()`
- [ ] Implement Global API Endpoints
  - [ ] `GET /api/global/recent`
  - [ ] `POST /api/global/open` (validates path, check for `forge.json`)
  - [ ] `POST /api/global/create` (runs `forge init` in target)
- [ ] Update `ProjectService`
  - [ ] Support lazy loading (unloading current project, loading new one)
- [ ] **Single Binary Integration**
  - [ ] Use `embed` package to bundle `dist/forge-studio` into the binary
  - [ ] Create `StaticController` using `go/kit/transport/rest` to serve assets on `/`
  - [ ] Handle SPA routing (redirect 404s to `index.html`) using kit middleware/handler
- [ ] **Local Experience**
  - [ ] Implement `xos.OpenInEditor(path, line)` (supports `code .`, `idea`, etc via env var)
  - [ ] Implement `LogStreamer` to pipe stdout/stderr to WebSocket hub

## Studio UI (`forge-studio`)

- [ ] **Infrastructure**
  - [ ] Create `GlobalState` (Signal Store) to track `currentProject`, `recentProjects`
  - [ ] Implement Layout service (Start Screen vs Dashboard)
- [ ] **Start Screen**
  - [ ] Implement "VSCode-style" layout (Recent list, Action buttons)
  - [ ] Add "Open Folder" dialog integration (use native browser API or generic prompt)
  - [ ] Add "Clone Repo" modal
- [ ] **Dashboard Layout**
  - [ ] Implement "Supabase-style" Sidebar
  - [ ] Create `OverviewComponent` (Stats, Health)
  - [ ] Create `ArchitectureComponent` (The Node Editor wrapper)
  - [ ] Create `DataModelsComponent` (Schema Table View)
- [ ] **Theming**
  - [ ] Enforce Dark Mode variables (`#121212` background)
  - [ ] Update Tailwind config for new color palette

## Testing

- [ ] Test `forge studio` without any active project
- [ ] Test opening an existing project
- [ ] Test creating a new project in an empty folder
