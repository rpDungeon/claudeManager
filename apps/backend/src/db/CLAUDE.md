# Database Module

SQLite database using Drizzle ORM with `bun:sqlite`.

## Schema

### projects
Container for organizing terminals and Claude sessions.
- `path` - Working directory for this project

### claude_sessions
Tracked Claude Code sessions for easy resume.
- `claudeSessionId` - The actual Claude session ID we pass to `claude --session-id`
- `name` - Optional display name
- `description` - Optional description of what this session is for
- `status` - active | paused | completed

We control the `claudeSessionId` so we can:
- Resume sessions easily
- Create overview of all sessions
- Associate terminals with specific sessions

### terminals
PTY terminal instances (shell or claude).
- `claudeSessionId` - Only set for claude terminals, links to the session
- `layoutConfig` - JSON string for pane positioning

## Files

- `db.schema.ts` - Drizzle table definitions and relations
- `db.client.ts` - Database connection setup
- `db.env.ts` - DATABASE_PATH env validation
