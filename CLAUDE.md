# Claude Manager

Browser-based terminal manager for spawning and managing Claude Code instances.

## Tech Stack

- **Runtime**: Bun (NOT Node.js)
- **Monorepo**: Bun workspaces
- **Backend**: ElysiaJS (Bun)
- **Frontend**: SvelteKit with Svelte 5
- **Database**: SQLite with Drizzle ORM (using `bun:sqlite`)
- **Terminal**: xterm.js with PTY
- **UI**: TailwindCSS, bits-ui, paneforge

## Bun Usage (IMPORTANT)

**Always use Bun, never Node.js or npm:**

```bash
# Package management
bun install              # Install dependencies
bun add <package>        # Add dependency
bun add -d <package>     # Add dev dependency
bun remove <package>     # Remove dependency

# Running scripts
bun run dev              # Run dev script
bun run build            # Run build script
bun run --filter '*' dev # Run script in all workspaces

# Direct execution
bun src/index.ts         # Run TypeScript directly
bun --watch src/index.ts # Run with watch mode
```

**Bun-specific features used:**
- `bun:sqlite` - Native SQLite (no native deps needed)
- `Bun.env` - Type-safe environment variables
- `bun run --filter` - Workspace script execution
- `bun build` - Fast bundling

## Skills Reference

When working on this project, use these skills:

- **sveltekit-development** - For all frontend work (pages, routes, components, Svelte 5 runes)
- **elysiajs-eden** - For backend API development and Eden Treaty client integration
- **drizzle-orm** - For database schema, queries, and migrations

## Project Structure

```
claudeManager/
├── apps/
│   ├── backend/          # ElysiaJS API + WebSocket PTY server
│   ├── common/           # Shared types and utilities
│   └── frontend/         # SvelteKit app with xterm.js
├── package.json          # Root workspace config
├── CLAUDE.md            # This file
└── .claude/docs/        # Planning and memory
```

## HARD RULE: Export Naming Convention

**All exports MUST follow the pattern: `path` + `action/thing`**

The name should read as: "what it is" followed by "what it does".

```typescript
// CORRECT - path first, then action
export const claudeSessionIdGenerate = () => ...
export const projectIdGenerate = () => ...
export const terminalCreate = z.object(...)
export const claudeSessionStatusEnum = ...
export type ProjectId = ...

// WRONG - action first
export const generateClaudeSessionId = () => ...
export const createTerminal = z.object(...)
export function generateProjectId() ...
```

This convention:
- Groups related exports alphabetically in IDE autocomplete
- Makes it clear what domain/feature an export belongs to
- Enforced by ESLint rule

## TypeScript Enums Over Union Types

**Prefer TypeScript enums over union string types for type definitions:**

```typescript
// GOOD - Use enum
export enum ClaudeSessionStatus {
	Active = "active",
	Paused = "paused",
	Completed = "completed",
}

// BAD - Avoid union types for this pattern
export type ClaudeSessionStatus = "active" | "paused" | "completed";
```

Benefits:
- Better IDE autocomplete
- Works with `z.nativeEnum()` and `t.Enum()` (Elysia/TypeBox)
- Easier refactoring
- Runtime value access

## CRITICAL: No Comments in Code Files

**NEVER add comments directly in code files.** Instead:
- Create a `CLAUDE.md` in the feature directory to document the code
- Use descriptive variable/function names instead of comments
- If something needs explanation, document it in the directory's `CLAUDE.md`

```
src/auth/
├── auth.service.ts      # NO comments in this file
├── auth.router.ts       # NO comments in this file
└── CLAUDE.md            # All documentation goes HERE
```

This keeps code clean and documentation centralized per feature.

## File Organization (Feature-Based Grouping)

**IMPORTANT: Always group files by feature, not by type.**

### Backend (`apps/backend/src/`)
Group by feature domain with consistent file suffixes:
```
src/
├── auth/
│   ├── auth.types.ts       # Type definitions
│   ├── auth.service.ts     # Business logic
│   ├── auth.router.ts      # Elysia routes
│   └── auth.middleware.ts  # Middleware
├── terminal/
│   ├── terminal.types.ts
│   ├── terminal.service.ts
│   ├── terminal.router.ts
│   └── terminal.websocket.ts
├── project/
│   ├── project.types.ts
│   ├── project.service.ts
│   └── project.router.ts
├── db/
│   ├── db.client.ts        # Database connection
│   └── db.schema.ts        # Drizzle schema
└── index.ts
```

**File suffix conventions:**
- `.types.ts` - Type definitions
- `.service.ts` - Business logic
- `.router.ts` - Elysia route handlers
- `.middleware.ts` - Middleware functions
- `.websocket.ts` - WebSocket handlers
- `.client.ts` - Client/connection setup
- `.schema.ts` - Database/validation schemas
- `.config.ts` - Configuration

### Frontend (`apps/frontend/src/lib/features/`)
Group by feature with component naming conventions:
```
src/lib/features/
├── common/                    # Shared UI components
│   ├── button/
│   │   ├── CommonButton.component.svelte
│   │   ├── CommonButton.stories.svelte
│   │   ├── CommonButton.variants.ts
│   │   └── index.ts
│   └── sidebar/
│       ├── _CommonSidebarItem.svelte    # Internal (underscore prefix)
│       ├── CommonSidebar.component.svelte
│       ├── CommonSidebar.stories.svelte
│       ├── context.svelte.ts
│       └── index.ts
├── terminal/                  # Terminal feature
│   ├── Terminal.component.svelte
│   ├── TerminalPane.component.svelte
│   └── index.ts
└── project/                   # Project management feature
    ├── ProjectList.component.svelte
    └── index.ts
```

**Component naming conventions:**
- `ComponentName.component.svelte` - Main component file
- `_ComponentName.svelte` - Internal/private sub-components (underscore prefix)
- `ComponentName.stories.svelte` - Storybook stories
- `ComponentName.variants.ts` - Tailwind variants (tailwind-variants)
- `ComponentName.svelte.spec.ts` - Tests
- `context.svelte.ts` - Svelte context
- `index.ts` - Barrel exports

### Common Package (`apps/common/`)
Shared schemas and types used by both frontend and backend:
```
apps/common/
├── features/
│   ├── project/
│   │   ├── project.schema.ts   # Drizzle schema + Zod + enums + branded IDs
│   │   └── project.types.ts    # Inferred types only
│   ├── terminal/
│   │   ├── terminal.schema.ts
│   │   └── terminal.types.ts
│   └── claude/
│       └── session/
│           ├── claudeSession.schema.ts
│           └── claudeSession.types.ts
├── types/
│   ├── common.types.ts         # Only NanoId, UnixTimestamp (true primitives)
│   └── util.types.ts           # Utility types (Brand<K,T>)
└── package.json
```

**Feature schema files contain:**
- Branded ID types (e.g., `ProjectId`, `TerminalId`)
- Enums (e.g., `ClaudeSessionStatus`, `TerminalType`)
- Zod validators (`projectCreate`, `projectUpdate`)
- Drizzle schema (`projectSchema`)

**Feature types files contain:**
- Only inferred types from schema (`type Project = InferSelectModel<typeof projectSchema>`)

## Interactive Terminals

Use `termux` for interactive terminal commands:
- `termux htop` - Interactive process viewer
- `termux vim file.txt` - Edit files interactively
- `termux bun run dev` - If you need to interact with dev server output

## Development Commands

```bash
# Install dependencies
bun install

# Run all apps in dev mode
bun run dev

# Run specific app
bun run backend:dev
bun run frontend:dev

# Database (from apps/backend)
bun run db:push      # Push schema to SQLite
bun run db:generate  # Generate migrations
bun run db:studio    # Open Drizzle Studio
```

## Environment Variables

```env
# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_PATH=./data/claude-manager.db

# Authentication
MASTER_PASSWORD=your-long-secure-password
JWT_SECRET=your-jwt-secret
```

## Environment Validation Pattern

Each feature has a `.env.ts` file that declares required env vars with Bun type augmentation:

```typescript
// src/auth/auth.env.ts
export const authEnvs = ["MASTER_PASSWORD", "JWT_SECRET"];

declare module "bun" {
  interface Env {
    MASTER_PASSWORD: string;
    JWT_SECRET: string;
  }
}
```

The `EnvValidator` in `src/common/common.env.ts` collects all env arrays and validates on startup.

## Key Features

1. **Auth**: Single master password with JWT sessions
2. **Projects**: Organize terminals by project with configurable working directories
3. **Terminals**: xterm.js with WebSocket PTY, resizable panes (paneforge), tabs
4. **Claude Sessions**: Track Claude Code chat IDs per project
