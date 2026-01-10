# Quick Open (Ctrl+P)

VS Code-style quick open with file fuzzy search and Go to Line support.

## Features

### File Fuzzy Search
- `Ctrl+P` opens modal
- Fuzzy match against all project files
- Show file path and icon
- Recent files prioritized at top
- Keyboard navigation (up/down arrows)
- Enter to open file

### Go to Line (`:` prefix)
- Type `:42` to jump to line 42 in current file
- Type `filename:42` to open file at line 42
- VS Code behavior: `:` alone shows "Go to Line" mode

### Go to Symbol (`@` prefix)
- Type `@` to show symbols in current file
- Type `@symbolName` to filter
- Uses LSP `textDocument/documentSymbol`

### Go to Symbol in Workspace (`#` prefix)
- Type `#` to search symbols across all files
- Uses LSP `workspace/symbol`

## Implementation Steps

1. Create `QuickOpen.component.svelte` modal
2. Implement fuzzy search algorithm (or use `fzf`-style library)
3. Index project files via backend API
4. Wire keyboard shortcuts
5. Integrate with editor to open files
6. Add `:` line number parsing
7. Add `@` symbol search via LSP
8. Add `#` workspace symbol search via LSP

## UI Design

```
┌─────────────────────────────────────────┐
│ > search query here                     │
├─────────────────────────────────────────┤
│ 📄 auth.service.ts         src/auth/    │
│ 📄 auth.router.ts          src/auth/    │
│ 📄 auth.types.ts           src/auth/    │
│ 📄 terminal.service.ts     src/lib/     │
└─────────────────────────────────────────┘
```

## Keyboard Shortcuts

- `Ctrl+P` - Open Quick Open
- `Ctrl+G` - Open Quick Open with `:` prefilled (Go to Line)
- `Ctrl+Shift+O` - Open Quick Open with `@` prefilled (Go to Symbol)
- `Ctrl+T` - Open Quick Open with `#` prefilled (Workspace Symbol)
- `Escape` - Close
- `Enter` - Open selected
- `Up/Down` - Navigate list

## Dependencies

- File indexing API endpoint
- LSP integration for symbols
- Fuzzy search library (optional)

## Priority

HIGH - This is a core navigation feature
