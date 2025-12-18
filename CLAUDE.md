# Claude Manager

Browser-based terminal manager for spawning and managing Claude Code instances.

## Tech Stack

- **Monorepo**: Bun workspaces
- **Backend**: ElysiaJS (Bun)
- **Frontend**: SvelteKit with Svelte 5
- **Database**: SQLite with Drizzle ORM
- **Terminal**: xterm.js with node-pty
- **UI**: TailwindCSS, bits-ui, paneforge

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
Shared types and utilities used by both frontend and backend:
```
apps/common/
├── types/
│   ├── common.types.ts      # Shared branded types (ProjectId, TerminalId, etc.)
│   └── util.types.ts        # Utility types (Brand<K,T>)
└── package.json
```

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

# Database
bun run db:push    # Push schema to SQLite
bun run db:studio  # Open Drizzle Studio
```

## Environment Variables

```env
MASTER_PASSWORD=your-long-secure-password
JWT_SECRET=your-jwt-secret
DATABASE_URL=file:./data/claude-manager.db
```

## Key Features

1. **Auth**: Single master password with JWT sessions
2. **Projects**: Organize terminals by project with configurable working directories
3. **Terminals**: xterm.js with WebSocket PTY, resizable panes (paneforge), tabs
4. **Claude Sessions**: Track Claude Code chat IDs per project
