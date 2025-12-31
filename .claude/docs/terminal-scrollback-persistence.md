# Terminal Scrollback Persistence

## Problem

The terminal implementation had two issues:
1. **Scrollback glitchy** - tmux mouse scrolling conflicted with xterm.js rendering
2. **History lost on reload** - Page refresh lost all terminal content

## Solution: dtach + xterm-headless + Disk Persistence

Replaced tmux with a three-layer approach:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  xterm.js (normal scrollback: 10_000, native mouse scroll)  │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    dtach    │  │  xterm-headless │  │  Disk Storage   │  │
│  │  (session   │◄─│  (state mirror) │──│  (persistence)  │  │
│  │  persist)   │  │                 │  │                 │  │
│  └─────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: dtach (Session Persistence)

dtach provides lightweight session detach/reattach without multiplexing:

```typescript
spawn("dtach", ["-A", socketPath, "-r", "winch", "/bin/bash"], {...})
```

- `-A` = attach or create session
- `-r winch` = redraw on window size change
- Socket at `/tmp/claude-terminal/<terminalId>.sock`

### Layer 2: xterm-headless (State Mirror)

Server-side xterm.js instance mirrors all PTY output:

```typescript
const headlessTerminal = new Terminal({
  allowProposedApi: true,  // REQUIRED for SerializeAddon
  cols, rows,
  scrollback: 10_000,
});
const serializeAddon = new SerializeAddon();
headlessTerminal.loadAddon(serializeAddon);

// Mirror PTY output
process.onData((data) => {
  headlessTerminal.write(data);
});
```

### Layer 3: Disk Persistence

Serialized state saved every 5 seconds:

```typescript
const SCROLLBACK_DIR = "/tmp/claude-terminal/scrollback";

setInterval(() => {
  const serialized = serializeAddon.serialize();
  writeFileSync(`${SCROLLBACK_DIR}/${terminalId}.scrollback`, serialized);
}, 5000);
```

On reconnect, scrollback replayed to client:

```typescript
if (isReattach) {
  const saved = readFileSync(scrollbackPath, "utf-8");
  headlessTerminal.write(saved);
}

// Send to client on connect
ws.send({ data: existingInstance.getScrollback(), type: Output });
```

## Files Changed

| File | Change |
|------|--------|
| `apps/backend/src/terminal/pty/pty.service.ts` | Complete rewrite: dtach + xterm-headless |
| `apps/backend/src/terminal/pty/pty.websocket.ts` | Send scrollback on reconnect |
| `apps/backend/package.json` | Added `@xterm/headless`, `@xterm/addon-serialize` |
| `apps/frontend/src/lib/terminal/terminal.service.svelte.ts` | Reverted to normal xterm.js config |

## Dependencies Added

```bash
bun add @xterm/headless @xterm/addon-serialize
```

System dependency:
```bash
sudo dnf install -y dtach
```

## Why Not tmux?

tmux manages its own virtual terminal with escape sequences that conflict with xterm.js:
- Mouse mode causes rendering glitches
- Scrollback requires entering copy-mode (Ctrl+B, [)
- Both trying to manage terminal state simultaneously

dtach only handles session persistence, leaving terminal rendering entirely to xterm.js.

## Critical: allowProposedApi

The SerializeAddon requires `allowProposedApi: true` on the Terminal instance:

```typescript
const headlessTerminal = new Terminal({
  allowProposedApi: true,  // Without this: "You must set the allowProposedApi option"
  // ...
});
```
