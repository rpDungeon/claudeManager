# Claude Manager Vision

A browser-based terminal workspace for managing multiple Claude Code instances across projects, with tmux-style pane management and VSCode-inspired organization.

## Core Philosophy

**"Tmux meets VSCode, synced everywhere"**

- **Tmux DNA**: Panes, splits, keyboard-driven, system stats, session naming
- **VSCode DNA**: Activity bar, projects sidebar, panels (problems, logs), tab groups
- **Cloud-native state**: All state lives on server, clients are thin receivers of WS events
- **Multi-device continuity**: Open browser on any device, see same layout instantly

## Target User

Single user (you) running this on a personal VM. No multi-user auth complexity. One master password, full control.

---

## Layout System

### What is a Layout?

A **Layout** is a saved workspace configuration:
- Which projects are open
- How panes are arranged (splits, sizes)
- Which terminals/sessions are in each pane
- Tab groupings within panes

### Layout Examples

```
Layout: "Full Stack Dev"
├── Project: sales-trainer (left 60%)
│   ├── Pane 1: Claude Session "backend-refactor"
│   └── Pane 2: Terminal "bun run dev"
└── Project: claude-manager (right 40%)
    └── Pane 1: Claude Session "frontend-ui"

Layout: "Claude Army"
├── Project: big-migration
│   ├── Pane 1: Claude "agent-1-auth"
│   ├── Pane 2: Claude "agent-2-api"
│   ├── Pane 3: Claude "agent-3-tests"
│   └── Pane 4: Claude "agent-4-docs"
```

### Layout Persistence

- Layouts stored in SQLite (server-side)
- No local storage dependency
- Switch devices = same layouts instantly
- "+" button to create new layout
- Layouts can be renamed, duplicated, deleted

---

## UI Architecture

### Main Regions

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Layout: Full Stack Dev ▼  [+ New Layout]    [🔔] [⚙️]   │ <- Top Bar
├────────┬────────────────────────────────────────────┬───────────┤
│        │                                            │           │
│ P      │  ┌─────────────────┬─────────────────┐    │ Activity  │
│ r      │  │ Project A       │ Project B       │    │ Feed      │
│ o      │  │ ┌─────┬───────┐ │ ┌─────────────┐ │    │           │
│ j      │  │ │Pane1│ Pane2 │ │ │   Pane 1    │ │    │ [tools]   │
│ e      │  │ │     │       │ │ │             │ │    │ [events]  │
│ c      │  │ │     │       │ │ │             │ │    │ [errors]  │
│ t      │  │ └─────┴───────┘ │ └─────────────┘ │    │           │
│ s      │  └─────────────────┴─────────────────┘    │           │
│        │                                            │           │
├────────┴────────────────────────────────────────────┴───────────┤
│ [cpu] [mem] [sessions: 4] [errors: 0]    12:34 PM  │ Status Bar │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Top Bar
- Logo / App name
- Current layout selector (dropdown to switch layouts)
- "+ New Layout" button
- Notification bell (shows problems count)
- Settings gear

### 2. Projects Sidebar (Left)
- List of all projects in database
- Click to add project to current layout
- Shows active session count per project
- Collapsible (keyboard: `Cmd+B`)
- Can drag projects to reorder

### 3. Workspace Area (Center)
- **Multi-project canvas**: Side-by-side project containers
- Each project container has:
  - Project header (name, path, collapse toggle)
  - Tab bar with tab groups (color-coded)
  - Pane area (tmux-style splits)
- Panes can be:
  - Split horizontally/vertically
  - Resized by dragging dividers
  - Named (double-click header to rename)
  - Zoomed (temporary fullscreen)

**Key Mental Model**:
- Layout shows **multiple projects concurrently** (side by side)
- Each project has **multiple Claude Code sessions concurrently** (in panes/tabs)
- Sessions started via UI button get **system-generated ID**
- Sessions appear in **left sidebar** with resume button (click to reconnect)

### 4. Activity Feed (Right, Collapsible)
- Real-time event stream
- Sources:
  - Claude Code tool calls (via hooks)
  - Terminal output highlights
  - Errors and warnings
- Filterable by project or terminal
- Click event to jump to relevant pane

> **Note**: Activity feed is lower priority. Don't over-engineer - basic per-project filtering is fine.

### 5. Bottom Panels (Collapsible)
- **Problems**: Failed commands (non-zero exit) + Claude errors
- **Agent Log**: Aggregated Claude session activity
- **Output**: Raw logs from all terminals

### 6. Status Bar (Bottom)
- System stats: CPU %, Memory %
- Active sessions count
- Error count (clickable to open Problems)
- Current time
- Connection status indicator

---

## Pane Management (Tmux-Style)

### Pane Operations
| Action | Keyboard | Mouse |
|--------|----------|-------|
| Split horizontal | `TBD` | Right-click > Split H |
| Split vertical | `TBD` | Right-click > Split V |
| Navigate panes | `TBD` | Click pane |
| Resize pane | `TBD` | Drag divider |
| Zoom pane | `TBD` | Double-click header |
| Close pane | `TBD` | Click X on header |
| Rename pane | `TBD` | Double-click name |

> **Note**: Keyboard shortcuts TBD - decide on prefix key (tmux-style `Ctrl+B`?) during implementation.

### Pane Types
1. **Terminal**: Regular shell (PTY)
2. **Claude Session**: Terminal auto-started with `claude` command
   - Shows session status (active/idle/completed)
   - Can pause/resume

---

## Tab System

### Tab Groups (Chrome-style)
- Tabs within a project can be grouped
- Groups have:
  - Color indicator
  - Label (e.g., "Backend", "Frontend", "Tests")
- Drag tabs between groups
- Collapse/expand groups

### Tab Features
- Show session name
- Status indicator (dot: green=active, yellow=idle, red=error)
- Close button on hover
- Drag to reorder
- Drag to different pane

---

## WebSocket Architecture

### Why WS-Based State?

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser A  │     │   Server    │     │  Browser B  │
│  (Laptop)   │◄────┤  (Source    ├────►│  (Desktop)  │
│             │     │   of Truth) │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    ┌─────┴─────┐
                    │  SQLite   │
                    │  + PTYs   │
                    └───────────┘
```

- Server holds all state (layouts, projects, sessions, terminal buffers)
- Clients connect via WS
- All mutations go through server
- Server broadcasts state changes to all connected clients
- Client reconnects = full state sync

### Event Types (Server → Client)
```typescript
type WSEvent =
  | { type: "layout:sync", layout: Layout }
  | { type: "terminal:output", sessionId: string, data: string }
  | { type: "session:status", sessionId: string, status: Status }
  | { type: "stats:update", cpu: number, mem: number }
  | { type: "problem:new", problem: Problem }
  | { type: "activity:event", event: ActivityEvent }
```

### Commands (Client → Server)
```typescript
type WSCommand =
  | { type: "layout:switch", layoutId: string }
  | { type: "layout:create", name: string }
  | { type: "pane:split", paneId: string, direction: "h" | "v" }
  | { type: "pane:resize", paneId: string, size: number }
  | { type: "terminal:input", sessionId: string, data: string }
  | { type: "session:create", projectId: string, type: "terminal" | "claude" }
```

---

## Claude Code Integration

### Session Types
1. **Regular Terminal**: Just a shell
2. **Claude Session**: Shell that auto-runs `claude` on start

### Hooks Integration (Future)
- Use Claude Code hooks to capture tool events
- Stream events to Activity Feed
- Events: tool calls, file reads/writes, bash commands
- Helps monitor what Claude is doing across sessions

### Problems Detection
- Monitor terminal output for:
  - Non-zero exit codes
  - Error patterns (stack traces, "Error:", etc.)
- Surface in Problems panel
- Badge count in status bar

---

## Data Model

```
Layout
├── id: string
├── name: string
├── projectPanes: ProjectPane[]
└── createdAt, updatedAt

ProjectPane
├── id: string
├── projectId: string
├── position: { x, y, width, height }
├── panes: Pane[]
└── tabGroups: TabGroup[]

Pane
├── id: string
├── sessionId: string (→ ClaudeSession or Terminal)
├── splits: Split[]
└── name: string

TabGroup
├── id: string
├── name: string
├── color: string
└── tabIds: string[]

ClaudeSession
├── id: string
├── projectId: string
├── name: string
├── status: "active" | "idle" | "completed" | "error"
└── ptyId: string

Terminal
├── id: string
├── projectId: string
├── name: string
└── ptyId: string
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] PTY WebSocket server (spawn, stream, resize)
- [ ] xterm.js terminal component
- [ ] Basic pane system (single pane, then splits)
- [ ] Project CRUD + sidebar

### Phase 2: Multi-Pane
- [ ] Pane splitting (h/v)
- [ ] Pane resizing with paneforge
- [ ] Tab bar per project
- [ ] Tab drag and drop

### Phase 3: Layouts
- [ ] Layout model + CRUD
- [ ] Layout switcher UI
- [ ] State sync across browser tabs
- [ ] Reconnection handling

### Phase 4: Monitoring
- [ ] Status bar with system stats
- [ ] Problems panel
- [ ] Activity feed (basic)
- [ ] Agent log panel

### Phase 5: Polish
- [ ] Tab groups with colors
- [ ] Keyboard shortcuts (tmux-style)
- [ ] Pane naming
- [ ] Claude Code hooks integration

---

## Non-Goals (For Now)

- Multi-user collaboration
- Layout export/import
- Mobile UI
- Plugin system
- Theming (dark mode only)
