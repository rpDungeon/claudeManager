# vtlsp + CodeMirror MVP

Minimal experiment demonstrating CodeMirror 6 with TypeScript IntelliSense via vtlsp.

## Architecture

Browser (CodeMirror + @valtown/codemirror-ls) <-> WebSocket <-> Bun Server (@valtown/ls-ws-server) <-> typescript-language-server

## Prerequisites

- typescript-language-server must be installed: `bun add -g typescript-language-server typescript`

## Running

```bash
bun install
bun run dev
```

Open http://localhost:3000

## Features

- Autocomplete (type `.` or press `Ctrl+Space`)
- Hover for type information
- Diagnostics (red squiggly for type errors)
- Signature help (function parameters)
