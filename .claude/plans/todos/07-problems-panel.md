# Problems Panel

Centralized view of all errors, warnings, and info from LSP diagnostics.

## Features

### Diagnostics List
- Show all problems across open files
- Group by file or show flat list
- Filter by severity (Error, Warning, Info, Hint)
- Filter by source (TypeScript, ESLint, etc.)
- Search/filter problems

### Problem Details
- File path and line number
- Error message
- Error code (clickable for docs)
- Quick fix actions (if available)

### Navigation
- Click to jump to problem location
- F8 / Shift+F8 to cycle through problems
- Auto-focus on save

## Implementation Steps

1. Create `ProblemsPanel.component.svelte`
2. Aggregate diagnostics from all LSP connections
3. Create store for centralized problem tracking
4. Add filtering and sorting
5. Integrate with editor navigation
6. Add keyboard shortcuts
7. Show problem count in status bar

## UI Design

```
┌─────────────────────────────────────────────────────────────────┐
│ PROBLEMS  │ OUTPUT │ TERMINAL │           [Filter] [🔴 5] [⚠️ 12] │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 src/auth/auth.service.ts                                      │
│   12:5   Type 'string' is not assignable to type 'number' ts2322 │
│   45:10  Cannot find name 'foo'                          ts2304  │
│                                                                  │
│ ⚠️ src/terminal/terminal.types.ts                                 │
│   5:1    'TerminalAuth' is defined but never used        ts6196  │
│   22:15  Missing return type on function                 ts7010  │
│                                                                  │
│ 🔴 src/editor/editor.lib.ts                                      │
│   89:3   Property 'x' does not exist on type 'Y'         ts2339  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structure

```typescript
interface Problem {
  id: string;
  filePath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: "error" | "warning" | "info" | "hint";
  message: string;
  code?: string | number;
  source?: string; // "typescript", "eslint", etc.
  codeActions?: CodeAction[];
}

interface ProblemsState {
  problems: Problem[];
  filter: {
    severity: ("error" | "warning" | "info" | "hint")[];
    search: string;
    source?: string;
  };
  groupByFile: boolean;
}
```

## LSP Integration

Diagnostics come via `textDocument/publishDiagnostics` notification:

```typescript
interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}
```

## Status Bar Integration

Show problem counts in status bar:
```
🔴 5  ⚠️ 12  ℹ️ 3
```

Clicking opens Problems panel.

## Keyboard Shortcuts

- `Ctrl+Shift+M` - Toggle Problems panel
- `F8` - Go to next problem
- `Shift+F8` - Go to previous problem

## Priority

HIGH - Essential for development workflow
