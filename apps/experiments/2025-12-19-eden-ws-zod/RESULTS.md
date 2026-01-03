# Experiment Results: Eden Treaty WebSocket with Zod Validation

## Summary

This experiment successfully demonstrates that Eden Treaty WebSocket subscriptions work with Zod validation, providing full type safety from server to client.

## What Works

### 1. Zod Schema Validation on Server

```typescript
const messageSchema = z.object({
  type: z.enum(['chat', 'ping', 'command']),
  payload: z.object({
    text: z.string(),
    timestamp: z.number(),
  }),
})

const responseSchema = z.object({
  type: z.enum(['chat', 'pong', 'result']),
  payload: z.object({
    text: z.string(),
    timestamp: z.number(),
    serverId: z.string(),
  }),
})
```

The server validates both incoming messages (`body`) and outgoing messages (`response`) using these Zod schemas.

### 2. Eden Treaty Client Type Inference

```typescript
const api = treaty<App>('localhost:3000')
const chat = api.chat.subscribe()
```

The client automatically infers types from the server's schema via `type App = typeof app`.

### 3. Full Type Safety on Messages

When calling `chat.send()`, TypeScript enforces:
- `type` must be one of `'chat' | 'ping' | 'command'`
- `payload` must have `text: string` and `timestamp: number`

When receiving messages via `chat.subscribe()`, TypeScript knows:
- `message.type` is `'chat' | 'pong' | 'result'`
- `message.payload` has `text`, `timestamp`, and `serverId`

### 4. Runtime Validation

The server logs show that Zod is successfully parsing and validating incoming messages:

```
Received message: {
  type: "ping",
  payload: {
    text: "Ping from client",
    timestamp: 1766166649482,
  },
}
```

## Important Discovery: Event Wrapping

Eden Treaty wraps WebSocket messages in an event object:

```typescript
chat.subscribe((event) => {
  const message = 'data' in event ? event.data : event
  // Now message has the correct type
})
```

The actual typed message is in `event.data`, not directly in the callback parameter.

## Type Safety Examples

### Valid Message (Compiles & Works)
```typescript
chat.send({
  type: 'chat',
  payload: {
    text: 'Hello',
    timestamp: Date.now(),
  },
})
```

### Invalid Messages (Would fail type checking)
```typescript
chat.send({
  type: 'invalid',  // Type '"invalid"' is not assignable to type '"chat" | "ping" | "command"'
  payload: { text: 'Hi', timestamp: 123 }
})

chat.send({
  type: 'chat',
  payload: { text: 'Hi' }  // Property 'timestamp' is missing
})

chat.send({
  type: 'chat',
  payload: 'string'  // Type 'string' is not assignable to type '{ text: string; timestamp: number }'
})
```

## Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│             │                    │             │
│ Eden Treaty │◄───────────────────┤  ElysiaJS   │
│   + Zod     │   Type-safe WS     │   + Zod     │
│             │                    │             │
└─────────────┘                    └─────────────┘
      │                                   │
      │  chat.send({ type, payload })    │
      ├──────────────────────────────────►│
      │        (validated by Zod)         │
      │                                   │
      │  ws.send({ type, payload })      │
      │◄──────────────────────────────────┤
      │        (validated by Zod)         │
```

## Conclusions

1. **Zod works seamlessly with ElysiaJS WebSockets** - No need to use TypeBox (t.Object)
2. **Eden Treaty provides full type inference** - Types flow automatically from server to client
3. **Both compile-time and runtime validation work** - TypeScript catches errors, Zod validates at runtime
4. **Message wrapping needs to be handled** - Use `'data' in event ? event.data : event` pattern
5. **Standard Schema support is real** - Elysia 1.4+ supports Zod alongside TypeBox

## Running the Experiment

```bash
bun install

bun run server.ts

bun run client.ts
```

Expected output shows typed messages being sent and received with full validation.

## Sources

- [ElysiaJS Validation Documentation](https://elysiajs.com/essential/validation)
- [ElysiaJS WebSocket Documentation](https://elysiajs.com/patterns/websocket)
- [Elysia 1.4 Release - Standard Schema Support](https://elysiajs.com/blog/elysia-14)
