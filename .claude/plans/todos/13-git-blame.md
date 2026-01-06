# Git Blame

Show per-line git annotations in the editor gutter.

## Features

### Blame Gutter
- Author name
- Commit date (relative: "2 days ago")
- Commit message (truncated)
- Color-coded by age or author

### Hover Details
- Full commit message
- Author email
- Commit SHA (clickable)
- Changed files count

### Navigation
- Click to see commit in diff view
- Click author to filter by author
- Click SHA to open commit details

## Implementation Steps

1. Create backend API for git blame
2. Create `BlameGutter.component.svelte`
3. Add blame decorations to editor
4. Implement hover tooltip
5. Add color coding logic
6. Wire navigation actions

## UI Design

### Blame Gutter
```
│ John D. • 2d ago  │ 1 │ import { foo } from './bar';
│ John D. • 2d ago  │ 2 │
│ Jane S. • 1w ago  │ 3 │ const value = 'test';
│ Jane S. • 1w ago  │ 4 │
│ Bot     • 3mo ago │ 5 │ export function main() {
│ John D. • 2d ago  │ 6 │   return value;
│ Bot     • 3mo ago │ 7 │ }
```

### Hover Tooltip
```
┌─────────────────────────────────────────────────┐
│ 🔷 abc1234 (2 days ago)                         │
│                                                 │
│ fix: resolve authentication bug                 │
│                                                 │
│ The token was expiring too early because...     │
│                                                 │
│ John Doe <john@example.com>                     │
│ 3 files changed                                 │
│                                                 │
│ [View Commit] [View Diff]                       │
└─────────────────────────────────────────────────┘
```

## Backend API

```typescript
// GET /api/git/blame?filePath=...
{
  lines: {
    sha: string;
    author: string;
    authorEmail: string;
    date: string; // ISO
    message: string;
    lineNumber: number;
  }[];
}
```

## Git Command

```bash
# Get blame with porcelain format for parsing
git blame --porcelain path/to/file
```

## Porcelain Output Format

```
abc1234567890 1 1 3
author John Doe
author-mail <john@example.com>
author-time 1234567890
author-tz +0000
committer John Doe
committer-mail <john@example.com>
committer-time 1234567890
committer-tz +0000
summary fix: resolve auth bug
filename path/to/file
	import { foo } from './bar';
```

## Color Coding

### By Age
```typescript
function getAgeColor(date: Date): string {
  const daysAgo = daysSince(date);
  if (daysAgo < 7) return "text-terminal-green";
  if (daysAgo < 30) return "text-terminal-cyan";
  if (daysAgo < 90) return "text-terminal-amber";
  return "text-text-tertiary";
}
```

### By Author
```typescript
function getAuthorColor(author: string): string {
  const hash = hashString(author);
  const colors = ["#00ff41", "#00e5ff", "#ffb000", "#ff3333", "#9d4edd"];
  return colors[hash % colors.length];
}
```

## Toggle Behavior

- Default: Blame hidden
- Toggle to show blame gutter
- Persists per file or globally (setting)

## Keyboard Shortcuts

- `Ctrl+Shift+G B` - Toggle blame gutter
- `Ctrl+Click` on blame - Open commit

## Performance

- Cache blame data per file
- Invalidate on file change
- Lazy load on toggle
- Debounce hover requests

## Priority

LOW-MEDIUM - Nice to have for code archaeology
