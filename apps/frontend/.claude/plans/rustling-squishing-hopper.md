# Plan: Master Password Authentication System

## Current State

**Backend (95% ready):**
- Auth plugin exists: `apps/backend/src/auth/auth.plugin.ts`
- Login endpoint works: `POST /auth/login` (validates against `MASTER_PASSWORD` env)
- Verify endpoint works: `GET /auth/verify`
- JWT tokens with 7-day expiry
- **BLOCKED:** Global auth middleware is COMMENTED OUT in `apps/backend/src/api.ts`

**Frontend (50% ready):**
- API client already injects `auth_token` from localStorage as Bearer header
- SSE/WebSocket connections already pass token via query param
- **MISSING:** Login page
- **MISSING:** Route protection (auth guards)
- **MISSING:** Logout functionality

## Implementation Plan

### Step 1: Enable Backend Auth Middleware
**File:** `apps/backend/src/api.ts`

Uncomment the auth middleware:
```typescript
.use(authPlugin)
.onBeforeHandle(
  { as: "global" },
  ({ user, path, status }) => {
    if (path.startsWith("/auth")) return;
    if (!user) return status(401, { error: "Unauthorized" });
  },
)
```

### Step 2: Create Login Page
**File:** `apps/frontend/src/routes/login/+page.svelte`

Simple login form:
- Password input field
- Submit button
- Error message display
- On success: store token in localStorage, redirect to `/dashboard`
- CRT terminal aesthetic matching the rest of the app

### Step 3: Add Auth Guard Layout
**File:** `apps/frontend/src/routes/+layout.svelte` (modify)

Add client-side auth check:
- On mount, call `/auth/verify` with stored token
- If no token or invalid: redirect to `/login`
- If valid: render children
- Exclude `/login` route from protection

### Step 4: Add Logout Button
**File:** `apps/frontend/src/routes/dashboard/+page.svelte` (modify)

Add logout functionality to sidebar/header:
- Clear `auth_token` from localStorage
- Redirect to `/login`

## Files to Modify/Create

| File | Action |
|------|--------|
| `apps/backend/src/api.ts` | Uncomment auth middleware |
| `apps/frontend/src/routes/login/+page.svelte` | Create login page |
| `apps/frontend/src/routes/+layout.svelte` | Add auth guard |
| `apps/frontend/src/routes/dashboard/+page.svelte` | Add logout button |

## Verification

1. Start backend and frontend dev servers
2. Open app in browser - should redirect to `/login`
3. Enter wrong password - should show error
4. Enter correct password (`dev-password-123`) - should redirect to dashboard
5. Refresh page - should stay on dashboard (token persisted)
6. Click logout - should redirect to login
7. Try accessing `/dashboard` directly - should redirect to login
8. Test SSE stream still works with auth (terminal updates)
