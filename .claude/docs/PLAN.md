# Claude Manager - Implementation Plan

## Overview

A browser-based terminal manager for spawning and managing Claude Code instances in a VM. Built as a Bun monorepo with SvelteKit frontend and Elysia backend.

## Architecture

```
claudeManager/
├── apps/
│   ├── backend/          # Elysia API + WebSocket PTY server
│   └── frontend/         # SvelteKit app with xterm.js
├── package.json          # Root workspace config
├── tsconfig.json         # Shared TS config
└── biome.json           # Linting config
```

## Key Decisions

- **Auth**: Single master password from env var, JWT session
- **Shell**: node-pty via WebSocket
- **Persistence**: SQLite with Drizzle ORM (simpler, no external DB needed)
- **Layout**: Tabs + resizable panes (paneforge)

## Skills to Use

- **sveltekit-development** - Frontend pages, routes, Svelte 5 runes
- **elysiajs-eden** - Backend API, WebSocket handlers, Eden Treaty client
- **drizzle-orm** - SQLite schema, queries, migrations

---

## Phase 1: Project Scaffolding

### 1.1 Initialize Monorepo
- Create root `package.json` with Bun workspaces
- Configure `tsconfig.json` for path aliases
- Set up `biome.json` for linting/formatting

### 1.2 Backend Setup (`apps/backend`)
- Initialize Elysia server
- Add dependencies: `elysia`, `@elysiajs/cors`, `@elysiajs/jwt`, `node-pty`, `drizzle-orm`, `better-sqlite3`
- Configure TypeScript

### 1.3 Frontend Setup (`apps/frontend`)
- Initialize SvelteKit project
- Add dependencies: `xterm`, `xterm-addon-fit`, `xterm-addon-web-links`, `paneforge`, `bits-ui`, `tailwindcss`
- Configure TailwindCSS v4

---

## Phase 2: Authentication

### 2.1 Backend Auth
- Create `/api/auth/login` endpoint
- Accept password, compare against `MASTER_PASSWORD` env var
- Return JWT token on success
- Create auth middleware for protected routes

### 2.2 Frontend Auth
- Login page with password input
- Store JWT in httpOnly cookie or localStorage
- Auth guard for protected routes
- Logout functionality

---

## Phase 3: Database & Models

### 3.1 Schema Design (SQLite)
```typescript
// projects table
projects {
  id: text (PK, nanoid)
  name: text
  path: text             // working directory for this project
  createdAt: integer     // unix timestamp
  updatedAt: integer
}

// terminals table
terminals {
  id: text (PK, nanoid)
  projectId: text (FK -> projects)
  name: text             // display name
  type: text             // 'shell' | 'claude'
  claudeChatId: text?    // if type='claude', the chat ID
  layout: text           // JSON string for pane position/size
  createdAt: integer
}

// sessions table (optional - for reconnection)
sessions {
  id: text (PK, nanoid)
  terminalId: text (FK -> terminals)
  pid: integer           // OS process ID
  active: integer        // 0 or 1 (SQLite boolean)
}
```

### 3.2 Drizzle Setup
- Configure drizzle.config.ts
- Generate migrations
- Create repository layer

---

## Phase 4: WebSocket PTY Server

### 4.1 PTY Manager
- `PtyManager` class to spawn/manage node-pty instances
- Map terminal IDs to PTY instances
- Handle resize events
- Cleanup on disconnect

### 4.2 WebSocket Handler
```typescript
// Endpoints
ws://host/terminal/:terminalId
- onMessage: write to PTY stdin
- onData (from PTY): send to client
- onResize: resize PTY
- onClose: optionally kill PTY or keep alive for reconnection
```

### 4.3 Claude Code Integration
- Special terminal type that runs `claude` command
- Parse output to extract chat ID when session starts
- Store chat ID in database

---

## Phase 5: Frontend Terminal UI

### 5.1 xterm.js Integration
- Create `<Terminal>` Svelte component
- Initialize xterm with addons (fit, web-links)
- WebSocket connection to backend
- Handle resize with ResizeObserver + fit addon

### 5.2 Pane Layout
- Use paneforge for resizable panes
- Support horizontal/vertical splits
- Persist layout to database
- Drag-to-resize functionality

### 5.3 Tab System
- Tab bar above terminal area
- Add/remove/rename tabs
- Each tab contains its own pane layout
- Keyboard shortcuts for tab switching

---

## Phase 6: Project Management

### 6.1 Sidebar/Navbar
- Project list in sidebar
- "Add Project" button + modal
- Project settings (name, path)
- Delete project (with confirmation)

### 6.2 Project View
- Display project terminals
- Claude session history (list of chat IDs)
- Quick actions: new terminal, new Claude session

---

## Phase 7: Claude Session Management

### 7.1 Session Tracking
- Detect Claude Code startup output
- Parse chat ID from session start
- Store in terminals table
- Display in project sidebar

### 7.2 Session History
- List all Claude chat IDs for a project
- Click to view (read-only log?) or resume session
- Option to delete session records

---

## Implementation Order

1. **Scaffolding** - Get monorepo structure working
2. **Backend basics** - Elysia server, CORS, basic routes
3. **Auth** - Login flow end-to-end
4. **Database** - Drizzle schema, migrations, basic CRUD
5. **PTY WebSocket** - Spawn shell, stream I/O
6. **xterm.js** - Basic terminal rendering
7. **Terminal resize** - Critical feature, get it right
8. **Pane layout** - paneforge integration
9. **Tabs** - Tab management
10. **Project CRUD** - Full project management
11. **Claude integration** - Chat ID tracking
12. **Polish** - Error handling, reconnection, UX

---

## Technical Notes

### Terminal Resize Flow
```
Browser resize → ResizeObserver → FitAddon.fit() →
sends {cols, rows} via WebSocket → backend resizes PTY
```

### PTY Cleanup
- Keep PTY alive briefly on WebSocket disconnect (allow reconnect)
- Kill PTY on explicit close or after timeout
- Clean up zombie processes

### Security
- Master password compared with timing-safe comparison
- JWT with reasonable expiry (e.g., 24h)
- WebSocket connections require valid JWT
- Sanitize project paths (prevent directory traversal)

---

## Dependencies Summary

### Backend
- `elysia` - HTTP/WebSocket server
- `@elysiajs/cors` - CORS handling
- `@elysiajs/jwt` - JWT auth
- `node-pty` - Pseudo-terminal spawning
- `drizzle-orm` + `better-sqlite3` - SQLite database
- `zod` - Validation (via Elysia's built-in)

### Frontend
- `@sveltejs/kit` - Framework
- `xterm` + addons - Terminal emulator
- `paneforge` - Resizable panes
- `bits-ui` - UI components
- `tailwindcss` - Styling
- `lucide-svelte` - Icons
