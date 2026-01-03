# Eden Treaty WebSocket with Zod Validation Experiment

This experiment demonstrates how to use Eden Treaty WebSocket subscriptions with Zod validation in ElysiaJS.

## Features

- **Zod validation** for WebSocket messages (both incoming and outgoing)
- **Full TypeScript type safety** - types flow from server to client
- **Eden Treaty client** with typed `subscribe()` method
- **Message schema** with discriminated union types

## Setup

```bash
bun install
```

## Running the Experiment

### Option 1: Manual (two terminals)

**Terminal 1:** Start the server
```bash
bun run server
```

**Terminal 2:** Run the client
```bash
bun run client
```

### Option 2: Automated demo
```bash
bun run demo
```

This starts the server, waits 2 seconds, runs the client, then cleans up.

## Schema Details

### Message Schema (Client → Server)
```typescript
{
  type: 'chat' | 'ping' | 'command',
  payload: {
    text: string,
    timestamp: number
  }
}
```

### Response Schema (Server → Client)
```typescript
{
  type: 'chat' | 'pong' | 'result',
  payload: {
    text: string,
    timestamp: number,
    serverId: string
  }
}
```

## Type Safety Verification

The client demonstrates that TypeScript correctly infers types:

1. Message types are restricted to `'chat' | 'ping' | 'command'`
2. Response types are typed as `'chat' | 'pong' | 'result'`
3. Payload structure is enforced at compile time
4. Missing required fields cause TypeScript errors
5. Invalid values cause TypeScript errors

## Key Learnings

- Elysia supports Standard Schema, allowing Zod alongside TypeBox
- WebSocket `body` schema validates incoming messages
- WebSocket `response` schema validates outgoing messages
- Eden Treaty's `subscribe()` returns fully typed `EdenWS`
- Message types flow automatically from server to client via `type App = typeof app`
