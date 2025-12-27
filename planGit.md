# Git Tab Implementation Plan

## Overview

Add a Git panel as a second tab in the sidebar (alongside file explorer), with full git workflow support and VS Code-style diff viewer.

## UI Structure

```
DashboardSidebar
├── DashboardSelector (Project)
├── DashboardSelector (Layout)
├── SidebarTabs ["Files" | "Git"]  <-- NEW
└── Tab Content
    ├── Files → DashboardFileExplorer (existing)
    └── Git → DashboardGitPanel (NEW)
        ├── Branch info header
        ├── Staged Changes (collapsible)
        ├── Changes (unstaged, collapsible)
        ├── Untracked Files (collapsible)
        └── Commit box (message + button)
```

Clicking a file opens `LayoutItemDiff` in a new layout tab with side-by-side diff.

---

## Implementation Phases

### Phase 1: Backend Git Service

**Install:** `bun add simple-git`

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/common/src/git/git.types.ts` | Enums: `GitFileStatusCode`, `GitFileArea`; Types: `GitFileEntry`, `GitStatus`, `GitFileDiff` |
| `apps/common/src/git/git.schema.ts` | Zod schemas for API validation |
| `apps/backend/src/git/git.service.ts` | Git operations via simple-git |
| `apps/backend/src/git/git.routes.ts` | REST endpoints |

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/git/status?path=` | Get repo status |
| POST | `/git/stage` | Stage files |
| POST | `/git/unstage` | Unstage files |
| POST | `/git/stage-all` | Stage all |
| POST | `/git/unstage-all` | Unstage all |
| POST | `/git/commit` | Commit with message |
| GET | `/git/diff?path=&file=&staged=` | Get file diff |

**Register in:** `apps/backend/src/api.ts`

---

### Phase 2: Backend WebSocket

**File:** `apps/backend/src/git/git.websocket.ts`

- Endpoint: `/ws/git/watch`
- Watch `.git/index` and `.git/HEAD` with chokidar
- Debounce 300ms, re-fetch `git status` on change
- Messages: `watch`/`unwatch` (client), `status`/`error` (server)

---

### Phase 3: Frontend Git Panel

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/frontend/src/lib/git/gitPanel.lib.ts` | Types, helpers, status color maps |
| `apps/frontend/src/lib/git/GitPanel.component.svelte` | Main panel component |
| `apps/frontend/src/lib/git/_GitStatusHeader.svelte` | Branch name, ahead/behind |
| `apps/frontend/src/lib/git/_GitFileGroup.svelte` | Collapsible file group |
| `apps/frontend/src/lib/git/_GitCommitBox.svelte` | Message input + commit button |

**Reuse:** `FileTree` component for file lists (already has status indicators)

---

### Phase 4: Sidebar Tabs Integration

**Files to modify:**

| File | Change |
|------|--------|
| `apps/frontend/src/routes/dashboard/DashboardSidebar.component.svelte` | Add tab state, render tabs, switch content |

**New file:**

| File | Purpose |
|------|---------|
| `apps/frontend/src/routes/dashboard/DashboardGitPanel.component.svelte` | WebSocket connection, passes data to GitPanel |

**Tab structure:**
```svelte
<div class="flex border-b border-border-default">
  <button class:active={tab === 'files'}>Files</button>
  <button class:active={tab === 'git'}>Git</button>
</div>
{#if tab === 'files'}
  <DashboardFileExplorer ... />
{:else}
  <DashboardGitPanel ... />
{/if}
```

---

### Phase 5: Diff Layout Item

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/common/src/layout/item/item.diff.ts` | Schema: `{ type: "diff", repoPath, filePath, staged }` |
| `apps/frontend/src/lib/layout/item/LayoutItemDiff.component.svelte` | Side-by-side diff viewer |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/common/src/layout/item/item.types.ts` | Add `layoutItemDiffSchema` to union |
| `apps/frontend/src/lib/layout/item/_LayoutItem.svelte` | Add case for `type === "diff"` |

**Diff viewer:** Two columns, syntax highlighted, line numbers, +/- coloring

---

## Critical Files Reference

**Backend patterns to follow:**
- `apps/backend/src/fs/fs.service.ts` - Service structure
- `apps/backend/src/fs/fs.websocket.ts` - WebSocket pattern

**Frontend patterns to follow:**
- `apps/frontend/src/lib/fileTree/` - Tree component (reuse)
- `apps/frontend/src/routes/dashboard/DashboardFileExplorer.component.svelte` - WebSocket integration
- `apps/frontend/src/lib/layout/item/LayoutItemMarkdown.component.svelte` - Layout item pattern

**Modify:**
- `apps/backend/src/api.ts` - Register git routes/websocket
- `apps/frontend/src/routes/dashboard/DashboardSidebar.component.svelte` - Add tabs
