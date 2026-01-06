# Find and Replace UI (Ctrl+F / Ctrl+H)

In-editor find and replace with visible UI controls.

## Current State

CodeMirror has built-in search via `@codemirror/search` (included in `codemirror` bundle).
The search panel exists but may need custom styling for CRT theme.

## Available CodeMirror Packages

### Currently Installed
- `codemirror@6.0.2` - Bundle (includes search, commands, autocomplete, lint)
- `@codemirror/autocomplete@6.20.0` - Completion
- `@codemirror/lang-css@6.3.1` - CSS language
- `@codemirror/lang-html@6.4.11` - HTML language
- `@codemirror/lang-javascript@6.2.4` - JS/TS language
- `@codemirror/lang-json@6.0.2` - JSON language
- `@codemirror/lang-markdown@6.5.0` - Markdown language
- `@codemirror/lint@6.9.2` - Linting/diagnostics
- `@codemirror/lsp-client@6.2.1` - LSP integration
- `@codemirror/state@6.5.3` - Editor state
- `@codemirror/theme-one-dark@6.1.3` - Theme
- `@codemirror/view@6.39.8` - Rendering
- `@replit/codemirror-lang-svelte@6.0.0` - Svelte language
- `@uiw/codemirror-themes@4.25.4` - Additional themes

### Transitive Dependencies (via codemirror bundle)
- `@codemirror/commands@6.10.1` - Commands
- `@codemirror/search@6.5.11` - Search functionality
- `@codemirror/language@6.12.1` - Language support base

### Available Extensions (Not Installed)
- `@codemirror/lang-python` - Python
- `@codemirror/lang-rust` - Rust
- `@codemirror/lang-cpp` - C++
- `@codemirror/lang-java` - Java
- `@codemirror/lang-sql` - SQL
- `@codemirror/lang-xml` - XML
- `@codemirror/lang-yaml` - YAML
- `@codemirror/lang-php` - PHP
- `@codemirror/lang-go` - Go
- `@codemirror/collab` - Collaborative editing
- `@codemirror/language-data` - All language support bundles
- `@codemirror/legacy-modes` - Legacy CodeMirror 5 modes
- `@codemirror/merge` - Diff/merge view
- `@codemirror/minimap` - Minimap extension
- `@codemirror/rectangular-selection` - Box selection
- `@codemirror/lsp` - Alternative LSP integration

## Features to Implement

### Find (Ctrl+F)
- Search input at top of editor
- Match highlighting in document
- Match count (e.g., "3 of 15")
- Next/Previous navigation
- Case sensitive toggle
- Regex toggle
- Whole word toggle

### Replace (Ctrl+H)
- Replace input below search
- Replace single
- Replace all
- Preserve case option

## Implementation Steps

1. Enable `@codemirror/search` panel (may already be in basicSetup)
2. Style the search panel to match CRT theme
3. Ensure keyboard shortcuts are working
4. Add custom UI if built-in is insufficient

## UI Design (CRT Themed)

```
┌─────────────────────────────────────────────────────┐
│ 🔍 [search          ] [.*] [Aa] [W]  3 of 15  ◀ ▶ ✕ │
│ ↻  [replace         ] [Replace] [Replace All]       │
└─────────────────────────────────────────────────────┘
│                                                     │
│  1 │ import { foo } from './bar';                  │
│  2 │ const [foo] = useState();  // highlighted     │
│  3 │                                               │
```

## Keyboard Shortcuts

- `Ctrl+F` - Open Find
- `Ctrl+H` - Open Find & Replace
- `F3` / `Shift+F3` - Next/Previous match
- `Enter` - Next match (in search input)
- `Ctrl+Enter` - Replace and find next
- `Ctrl+Alt+Enter` - Replace all
- `Escape` - Close search panel

## CodeMirror Search API

```typescript
import { openSearchPanel, closeSearchPanel, findNext, findPrevious, replaceNext, replaceAll } from "@codemirror/search";

// Open search panel
view.dispatch({ effects: openSearchPanel.of(true) });

// Configure search
const searchConfig = search({
  caseSensitive: false,
  regexp: false,
  wholeWord: false,
});
```

## Priority

HIGH - Basic editing feature, should already partially work
