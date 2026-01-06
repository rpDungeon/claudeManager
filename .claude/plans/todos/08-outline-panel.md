# Outline Panel

Symbol tree view for current file showing structure and enabling quick navigation.

## Features

### Symbol Tree
- Hierarchical view of file structure
- Classes, functions, variables, types
- Collapsible tree nodes
- Icons by symbol kind

### Navigation
- Click to jump to symbol
- Highlight current symbol based on cursor
- Search/filter symbols

### Sorting
- By position (default)
- By name (alphabetical)
- By kind (group types together)

## Implementation Steps

1. Create `OutlinePanel.component.svelte`
2. Request `textDocument/documentSymbol` from LSP
3. Build tree from hierarchical symbols
4. Track cursor position to highlight current
5. Add search/filter
6. Add sorting options
7. Style with icons

## UI Design

```
┌────────────────────────────────┐
│ OUTLINE            🔍 [Sort ▼] │
├────────────────────────────────┤
│ ▼ 📦 Editor.component.svelte   │
│   ▼ 🔷 Props (interface)       │
│       🔹 editorId: string      │
│       🔹 filePath: string      │
│       🔹 isActive?: boolean    │
│   ▶ 📐 handleSave (function)   │
│   ▶ 📐 handleLoad (function)   │
│   ▼ 🎯 $effect                 │
│       🔹 containerRef          │
│   📐 onMount                   │
└────────────────────────────────┘
```

## Symbol Kind Icons

```typescript
const symbolKindIcons: Record<SymbolKind, string> = {
  [SymbolKind.File]: "📄",
  [SymbolKind.Module]: "📦",
  [SymbolKind.Namespace]: "📦",
  [SymbolKind.Package]: "📦",
  [SymbolKind.Class]: "🔷",
  [SymbolKind.Method]: "📐",
  [SymbolKind.Property]: "🔹",
  [SymbolKind.Field]: "🔹",
  [SymbolKind.Constructor]: "🔨",
  [SymbolKind.Enum]: "📋",
  [SymbolKind.Interface]: "🔷",
  [SymbolKind.Function]: "📐",
  [SymbolKind.Variable]: "🔸",
  [SymbolKind.Constant]: "🔒",
  [SymbolKind.String]: "📝",
  [SymbolKind.Number]: "🔢",
  [SymbolKind.Boolean]: "🔘",
  [SymbolKind.Array]: "📚",
  [SymbolKind.Object]: "📦",
  [SymbolKind.Key]: "🔑",
  [SymbolKind.Null]: "⭕",
  [SymbolKind.EnumMember]: "📌",
  [SymbolKind.Struct]: "🏗️",
  [SymbolKind.Event]: "⚡",
  [SymbolKind.Operator]: "➕",
  [SymbolKind.TypeParameter]: "🔤",
};
```

## LSP Request

```typescript
const symbols = await lspClient.request("textDocument/documentSymbol", {
  textDocument: { uri: fileUri },
});

// Returns DocumentSymbol[] (hierarchical) or SymbolInformation[] (flat)
```

## Data Structure

```typescript
interface OutlineNode {
  name: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: OutlineNode[];
  isExpanded: boolean;
}
```

## Current Symbol Tracking

```typescript
$effect(() => {
  const cursorPosition = editorCursorPosition;
  const currentSymbol = findSymbolAtPosition(symbols, cursorPosition);
  highlightedSymbol = currentSymbol?.name;
});
```

## Keyboard Shortcuts

- `Ctrl+Shift+O` - Focus Outline panel (or Quick Open with @)
- Arrow keys - Navigate tree
- Enter - Go to symbol
- Left/Right - Collapse/Expand

## Priority

MEDIUM - Helpful for navigation, especially in large files
