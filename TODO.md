# TODO

## Pending Testing

### Localhost Dev Server Proxy (added 2025-12-31)

Test the new proxy feature that allows iframes to access localhost dev servers:

1. Start a dev server on any port (e.g., `bun run dev` on port 5173)
2. Create an iframe in the layout with URL `http://localhost:5173`
3. Verify it auto-converts to `https://devkit-be.autumnlight.org/proxy/5173/`
4. Verify the iframe loads the dev server content
5. Test HMR (edit a file, check if iframe updates)
6. Test nested localhost refs (FE on :5173 calling BE on :3000)

**Files created:**
- `apps/backend/src/proxy/proxy.types.ts`
- `apps/backend/src/proxy/proxy.service.ts`
- `apps/backend/src/proxy/proxy.routes.ts`

**Files modified:**
- `apps/backend/src/api.ts`
- `apps/frontend/src/routes/dashboard/DashboardLayout.component.svelte`

## Pre-existing Issues

### TypeScript errors in pty.websocket.ts

Missing variable declarations: `processPollingMap`, `lastProcessMap`

Location: `apps/backend/src/terminal/pty/pty.websocket.ts`
