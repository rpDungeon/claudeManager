# Common Types

Truly shared primitives only: `UnixTimestamp` for timestamps.

Feature-specific types (IDs, enums) belong in their respective feature schema files.

## ID Generation Pattern

IDs use Zod brand with lowercase prefixes:
- `project:abc123` → ProjectId
- `terminal:xyz789` → TerminalId
- `claude_session:def456` → ClaudeSessionId

See `id.utils.ts` for the generator using `customAlphabet` (lowercase only).
