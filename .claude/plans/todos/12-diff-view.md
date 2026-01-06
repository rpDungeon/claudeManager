# Diff View

Show file changes vs git or compare two files.

## Features

### Git Diff
- Show changes vs HEAD
- Show changes vs staged
- Show changes vs specific commit
- Inline diff (red/green highlighting)
- Side-by-side diff

### File Comparison
- Compare any two files
- Compare with clipboard
- Compare with previous version

### Inline Decorations
- Green background for additions
- Red background for deletions
- Gutter indicators
- Change count in status bar

## Implementation Steps

1. Install `@codemirror/merge` for diff view
2. Create backend API for git diff
3. Create `DiffView.component.svelte`
4. Implement inline decorations for changes
5. Add side-by-side mode
6. Add gutter change indicators
7. Wire up git commands

## Available Package

```bash
bun add @codemirror/merge
```

## UI Design

### Inline Diff
```
  1 │ import { foo } from './bar';
  2 │
- 3 │ const oldValue = 'old';
+ 3 │ const newValue = 'new';
  4 │
+ 5 │ // Added comment
  6 │ export function main() {
```

### Side-by-Side
```
┌─────────────────────────┬─────────────────────────┐
│ Original                │ Modified                │
├─────────────────────────┼─────────────────────────┤
│ const oldValue = 'old'; │ const newValue = 'new'; │
│                         │ // Added comment        │
│ export function main()  │ export function main()  │
└─────────────────────────┴─────────────────────────┘
```

### Gutter Indicators
```
│   │ 1 │ import...      │
│ + │ 2 │ const x = 1;   │  ← Green bar for addition
│ ~ │ 3 │ const y = 2;   │  ← Blue bar for modification
│ - │   │                │  ← Red indicates deletion (line missing)
│   │ 4 │ export...      │
```

## Backend API

```typescript
// GET /api/git/diff
{
  filePath: string;
  base?: "HEAD" | "staged" | string; // commit SHA
}

// Response
{
  hunks: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: {
      type: "context" | "add" | "delete";
      content: string;
    }[];
  }[];
}
```

## Git Commands

```bash
# Diff against HEAD
git diff HEAD -- path/to/file

# Diff against staged
git diff --cached -- path/to/file

# Diff against commit
git diff abc123 -- path/to/file

# Get file at specific revision
git show HEAD:path/to/file
```

## CodeMirror Merge Extension

```typescript
import { MergeView } from "@codemirror/merge";

const view = new MergeView({
  a: {
    doc: originalContent,
    extensions: [/* ... */],
  },
  b: {
    doc: modifiedContent,
    extensions: [/* ... */],
  },
  parent: container,
  orientation: "a-b", // or "b-a"
  revertControls: "a-to-b",
  highlightChanges: true,
  gutter: true,
});
```

## Keyboard Shortcuts

- `Ctrl+K Ctrl+D` - Open diff view for current file
- `Ctrl+D` - Show inline diff decorations toggle
- `Alt+F5` - Next change
- `Shift+Alt+F5` - Previous change

## Priority

MEDIUM - Valuable for code review and understanding changes
