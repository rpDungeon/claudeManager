# Breadcrumbs

File path navigation showing directory hierarchy and current symbol.

## Features

### Path Navigation
- Show full path: `src` > `lib` > `editor` > `Editor.component.svelte`
- Each segment is clickable
- Clicking opens dropdown with siblings
- Quick navigation to parent directories

### Symbol Navigation
- Show current symbol: `> Props` > `handleSave`
- Updates as cursor moves
- Click to see symbol outline
- Requires LSP `textDocument/documentSymbol`

## Implementation Steps

1. Create `Breadcrumbs.component.svelte`
2. Parse file path into segments
3. Add dropdown for each segment (sibling files/folders)
4. Integrate LSP for symbol tracking
5. Track cursor position for current symbol
6. Style with CRT theme

## UI Design

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 src › 📁 lib › 📁 editor › 📄 Editor.component.svelte › Props │
└─────────────────────────────────────────────────────────────┘
```

With dropdown on click:
```
┌─────────────────────────────────────────────────────────────┐
│ 📁 src › 📁 lib › 📁 editor › 📄 Editor.component.svelte    │
└────────────────────┬────────────────────────────────────────┘
                     │ 📄 Editor.component.svelte    │
                     │ 📄 Editor.stories.svelte      │
                     │ 📄 editor.lib.ts              │
                     │ 📄 editor.service.svelte.ts   │
                     └────────────────────────────────┘
```

## Data Requirements

### File Path Segments
```typescript
type BreadcrumbSegment = {
  name: string;
  path: string;
  type: "directory" | "file";
  siblings?: BreadcrumbSegment[];
};
```

### Symbol Segments (from LSP)
```typescript
type SymbolSegment = {
  name: string;
  kind: SymbolKind;
  range: Range;
  children?: SymbolSegment[];
};
```

## LSP Integration

```typescript
// Request document symbols
const symbols = await lspClient.request("textDocument/documentSymbol", {
  textDocument: { uri: fileUri },
});

// Find symbol containing cursor position
function findSymbolAtPosition(symbols: DocumentSymbol[], position: Position): DocumentSymbol | null {
  for (const symbol of symbols) {
    if (containsPosition(symbol.range, position)) {
      const child = findSymbolAtPosition(symbol.children ?? [], position);
      return child ?? symbol;
    }
  }
  return null;
}
```

## Keyboard Shortcuts

- `Ctrl+Shift+.` - Focus breadcrumbs
- Arrow keys to navigate
- Enter to select/open dropdown
- Escape to close dropdown

## Priority

MEDIUM - Improves navigation UX significantly
