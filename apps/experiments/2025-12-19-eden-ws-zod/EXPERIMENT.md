# Eden Treaty WebSocket + Zod Validation Experiment

**Date:** 2025-12-19
**Objective:** Verify that Eden Treaty WebSocket subscriptions support Zod validation with full TypeScript type safety

## Experiment Setup

### Dependencies
- `elysia` ^1.4.19 - ElysiaJS framework
- `@elysiajs/eden` ^1.4.5 - Eden Treaty client
- `zod` ^4.2.1 - Schema validation

### Files Created
- `server.ts` - ElysiaJS WebSocket server with Zod schemas
- `client.ts` - Eden Treaty client demonstrating typed subscriptions
- `type-safety-test.ts` - Example showing type inference
- `invalid-example.ts` - Examples of invalid code (for type checking)
- `RESULTS.md` - Detailed findings and conclusions

## Hypothesis

Eden Treaty should:
1. Allow Zod schemas for WebSocket `body` and `response` validation
2. Infer TypeScript types from server schemas on the client
3. Provide compile-time type safety for `chat.send()` and `chat.subscribe()`

## Implementation

### Server Schema (Zod)

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

### Server WebSocket Handler

```typescript
new Elysia()
  .ws('/chat', {
    body: messageSchema,        // Validates incoming messages
    response: responseSchema,   // Validates outgoing messages

    open(ws) { /* ... */ },
    message(ws, message) { /* ... */ },
    close(ws) { /* ... */ }
  })
```

### Client Implementation

```typescript
const api = treaty<App>('localhost:3000')
const chat = api.chat.subscribe()

chat.subscribe((event) => {
  const message = 'data' in event ? event.data : event
  // message is fully typed based on responseSchema
})

chat.send({
  // TypeScript enforces messageSchema structure
  type: 'chat',
  payload: { text: 'Hello', timestamp: Date.now() }
})
```

## Results

### ✅ Successful Validations

1. **Zod schemas work with ElysiaJS WebSockets**
   - Server validates incoming messages against `messageSchema`
   - Server validates outgoing messages against `responseSchema`
   - Runtime validation logs confirm Zod is parsing correctly

2. **Eden Treaty infers types from server**
   - `chat.send()` parameter is typed as `z.infer<typeof messageSchema>`
   - `chat.subscribe()` callback receives `z.infer<typeof responseSchema>`
   - No manual type annotations needed on client

3. **Compile-time type safety works**
   - Invalid message types cause TypeScript errors
   - Missing required fields cause TypeScript errors
   - Wrong payload structures cause TypeScript errors

4. **Runtime behavior is correct**
   - Messages are validated on send and receive
   - Invalid messages would be rejected by Zod
   - Type discriminators (`type` field) work correctly

### 📋 Key Discoveries

1. **Event Wrapping**: Eden Treaty wraps messages in `{ isTrusted, data }` objects
   - Use pattern: `const message = 'data' in event ? event.data : event`

2. **Standard Schema Support**: Elysia 1.4+ supports Zod natively
   - No need for TypeBox (`t.Object`)
   - Can mix Zod and TypeBox in same app

3. **Type Export Pattern**: Must export server type for client inference
   ```typescript
   export type App = typeof app
   ```

## Test Execution

```bash
bun install
bun run demo
```

**Expected Output:**
- Server starts on port 3000
- Client connects and sends 3 messages (ping, chat, command)
- Server responds with typed messages (pong, chat, result)
- All messages are validated and typed correctly
- Client disconnects cleanly

## Conclusions

**VERIFIED:** Eden Treaty WebSocket subscriptions fully support Zod validation with complete TypeScript type safety.

### Benefits
- **Type safety**: Compile-time errors for invalid messages
- **Runtime validation**: Zod validates all messages
- **Developer experience**: Autocomplete and type inference work perfectly
- **Flexibility**: Can use Zod, TypeBox, or other Standard Schema validators

### Limitations
- Event wrapping requires handling (`event.data` pattern)
- TypeScript definition errors in Elysia libraries (don't affect runtime)

### Recommendation
**Use Zod for WebSocket validation in ElysiaJS + Eden Treaty projects.** It provides the best developer experience with full type safety.

## References

- [ElysiaJS Validation Documentation](https://elysiajs.com/essential/validation)
- [ElysiaJS WebSocket Patterns](https://elysiajs.com/patterns/websocket)
- [Elysia 1.4 - Standard Schema Support](https://elysiajs.com/blog/elysia-14)
- [Eden Treaty WebSocket Documentation](https://elysiajs.com/eden/treaty/websocket.html)
