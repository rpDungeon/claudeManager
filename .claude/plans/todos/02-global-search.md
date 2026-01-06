# Global Search (Ctrl+Shift+F)

Search across all files in the project with regex support and replace functionality.

## Features

### Search
- Search input with query
- Include/exclude glob patterns
- Case sensitive toggle
- Whole word toggle
- Regex toggle
- Match count display
- Results grouped by file

### Replace
- Replace input field
- Replace single occurrence
- Replace all in file
- Replace all in project
- Preview changes before applying

### Results Panel
- Collapsible file groups
- Line preview with match highlighting
- Click to jump to location
- Context lines (lines before/after match)

## Implementation Steps

1. Create `GlobalSearch.component.svelte` panel
2. Create backend API for ripgrep/grep search
3. Implement search results streaming (large results)
4. Add file filtering (include/exclude)
5. Implement replace functionality
6. Add keyboard shortcuts
7. Integrate with editor (jump to result)

## UI Design

```
┌─────────────────────────────────────────┐
│ 🔍 [search query        ] [.*] [Aa] [W] │
│ ↻  [replace with        ] [Replace All] │
│ files to include: [              ]      │
│ files to exclude: [node_modules  ]      │
├─────────────────────────────────────────┤
│ 42 results in 12 files                  │
│                                         │
│ ▼ src/auth/auth.service.ts (5)          │
│   12: const authToken = "..."           │
│   45: function authenticate() {         │
│   89: export const authMiddleware       │
│                                         │
│ ▼ src/terminal/terminal.types.ts (3)    │
│   5: export type TerminalAuth = {       │
│   22: authRequired: boolean;            │
└─────────────────────────────────────────┘
```

## Keyboard Shortcuts

- `Ctrl+Shift+F` - Open Global Search panel
- `Ctrl+Shift+H` - Open Global Search with Replace focused
- `Enter` - Search (in input)
- `F4` / `Shift+F4` - Next/Previous result
- `Escape` - Close panel

## Backend API

```typescript
// POST /api/search
{
  query: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  isWholeWord: boolean;
  include?: string[];  // glob patterns
  exclude?: string[];  // glob patterns
  maxResults?: number;
}

// Response (streaming)
{
  file: string;
  matches: {
    line: number;
    column: number;
    text: string;
    matchStart: number;
    matchEnd: number;
  }[];
}
```

## Dependencies

- Backend: ripgrep or grep
- Streaming response support
- Editor integration for navigation

## Priority

HIGH - Essential for code navigation in large projects
