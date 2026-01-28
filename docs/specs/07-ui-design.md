# Forge Framework - User Interface Design

**Version:** 1.1.0
**Status:** Active
**Last Updated:** 2026-01-28

---

## 1. Design Philosophy

Forge Studio combines the **project management efficiency of VS Code** with the **sleek, dashboard-driven aesthetics of Supabase**. It serves as the bridge between visual no-code architecture and low-code implementation.

**Core Principles:**

- **Native OS Elements**: Native title bars, translucent backdrops on macOS, and native context menus.
- **Dark Mode First**: Deep grays (`#121212`), high contrast accents, and subtle borders.
- **Content-Centric**: Minimal chrome, focus on the graph/code/data.
- **Contextual**: UI adapts based on the active project or selection.
- **Fluid Transitions**: Smooth animations between views (Start Screen -> Dashboard).

---

## 2. Global Start Screen (VS Code Style)

When `forge studio` is launched without a specific project context, or when closing a project, the user sees the **Start Screen**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Forge Studio                                                    [Feedback] │
│                                                                             │
│         ┌─────────────────────┐    ┌───────────────────────────────────┐    │
│         │     Forge           │    │  Recent Projects                  │    │
│         │                     │    │                                   │    │
│         │   [ New Project ]   │    │  trading-bot-v5                   │    │
│         │                     │    │  ~/Projects/trading-bot           │    │
│         │   [ Open Folder ]   │    │                                   │    │
│         │                     │    │  mmo-game-backend                 │    │
│         │   [ Clone Repo  ]   │    │  ~/Projects/mmo                   │    │
│         │                     │    │                                   │    │
│         │                     │    │  auth-service                     │    │
│         └─────────────────────┘    │  ~/Work/auth                      │    │
│                                    │                                   │    │
│                                    │  [Clear Recent]                   │    │
│                                    └───────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features

- **Open Folder**: Native OS dialog to pick a folder (Wails Dialog API).
  - If `forge.json` exists: Loads the project.
  - If missing: Prompts **"Forge Project not found. Initialize here?"**
- **Clone Repo**: Simple modal to paste a Git URL and pick a destination.
- **Recent Projects**: List of LRU projects with paths. Click to open.

---

## 3. Studio Dashboard (Supabase Style)

Once a project is loaded, the interface shifts to a **Sidebar + Content** layout similar to Supabase or Encore.

```
┌──────┬──────────────────────────────────────────────────────────────────────┐
│ ICON │  Breadcrumbs:  Org / trading-bot / main           [Connect] [Deploy] │
│ BAR  ├──────────────────────────────────────────────────────────────────────┤
│      │                                                                      │
│ [P]  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│      │  │  Services          │  │  Database          │  │  API Requests  │  │
│ [T]  │  │  3 Active          │  │  12 Tables         │  │  2.4k / min    │  │
│      │  │                    │  │                    │  │                │  │
│ [A]  │  └────────────────────┘  └────────────────────┘  └────────────────┘  │
│      │                                                                      │
│ [S]  │  ... (Main Content Area - Changes based on Sidebar) ...              │
│      │                                                                      │
│ [⚙]  │                                                                      │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

### 3.1 Sidebar Navigation (Left)

A thin, icon-based sidebar (expandable on hover) provides access to core modules:

| Icon | Label              | View Description                                                    |
| ---- | ------------------ | ------------------------------------------------------------------- |
| 🏠   | **Overview**       | Project summary, health status, recent activity, generation status. |
| 📐   | **Architecture**   | **The Node Editor**. Visual graph of services, entities, and flow.  |
| 🗃️   | **Data Models**    | Schema editor (like Supabase Table Editor). List/Edit Entities.     |
| 🔌   | **API Ops**        | OpenAPI browser, Endpoint testing (Swagger UI embedded).            |
| 🔐   | **Auth & Secrets** | SOPS secrets management, Authentication settings.                   |
| ⚙️   | **Settings**       | Project config (`forge.json` raw), Generator settings.              |

### 3.2 Main Content Area

This area renders the active module.

#### A. Architecture View (The Node Editor)

The "Classic" Forge view.

- **Canvas**: Drag-and-drop Nodes (Entities, Services, Transports).
- **Properties Panel**: Right-side drawer (collapsible).
- **Code Preview**: Bottom drawer (collapsible).

#### B. Data Models View

A table-based view of Entities, ideal for quick schema definition without dragging nodes.

- **List**: All Entities (Users, Orders, Products).
- **Editor**: Add fields, define types, setup relations.
- **Sync**: Changes here update the Graph and generated code automatically.

#### C. Overview View

- **Service Graph**: Mini-map of the architecture.
- **Activity Log**: "Generated migration X", "Added endpoint Y".
- **Documentation**: Quick links to generated godocs or diagrams.

---

## 4. Visual Design System

### 4.1 Color Palette

- **Background**: `#121212` (Main), `#1E1E1E` (Panels).
- **Accent**: `#10B981` (Emerald-500) for success/primary actions (Supabase Green).
- **Text**: `#EDEDED` (Primary), `#A1A1AA` (Secondary).
- **Borders**: `#3F3F46` (Subtle dividers).

### 4.2 Typography

- **Font**: Inter (UI), JetBrains Mono (Code).
- **Headings**: Semibold, clean tracking.

### 4.3 Interactive Elements

- **Buttons**:
  - Primary: Solid Accent color, rounded corners (4px).
  - Secondary: Transparent with border.
- **Inputs**: Dark gray background, subtle border, focus ring in Accent color.
- **Modals**: Center-aligned, backdrop blur.

---

## 5. Interaction Flows

### 5.1 Project Creation (No Code)

1. User clicks **"New Project"**.
2. Modal asks for **Project Name** and **Template** (e.g., "Empty", "SaaS Starter").
3. User picks a folder.
4. Forge CLI runs `forge init`.
5. Studio opens the new project in **Architecture View**.

### 5.2 Folder Opening (Existing Code)

1. User clicks **"Open Folder"**.
2. Selects `~/go/src/github.com/my/project`.
3. Studio checks for `forge.json`.
   - **Found**: Loads graph.
   - **Missing**: "Project not initialized. Create `forge.json`?" -> runs `forge init` flow if confirmed.
4. UI loads.

### 5.3 Editing Flow

1. User navigates to **Architecture View**.
2. Adds a **REST Endpoint** node connected to an **Entity**.
3. Clicks **Generate** (or Auto-save triggers generation).
4. Daemon updates files.
5. **Activity Log** in Sidebar briefly flashes "Code Generated".

---

## 6. Responsiveness

- **Desktop Only**: Optimized for 1024px+ width.
- **Sidebar**:
  - **Expanded**: > 1400px (Icon + Label).
  - **Collapsed**: < 1400px (Icon only, Tooltip on hover).

---

**Related Specifications:**

- [Architecture](01-architecture.md)
- [Node System](03-node-system.md)
