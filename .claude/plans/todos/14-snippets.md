# Snippets

Code templates with tab stops and placeholders.

## Features

### Snippet Expansion
- Type prefix, press Tab to expand
- Multiple tab stops ($1, $2, etc.)
- Placeholders with defaults (${1:default})
- Mirror variables (same value in multiple places)
- Nested placeholders

### Built-in Snippets
- Language-specific (TypeScript, Svelte, etc.)
- Common patterns (if, for, function, etc.)
- Framework patterns (Svelte component, effect, etc.)

### Custom Snippets
- User-defined snippets
- Project-specific snippets
- JSON-based definition

## Implementation Steps

1. Install/configure snippet support in CodeMirror
2. Create snippet definition format
3. Build snippet registry
4. Add built-in snippets for each language
5. Support user snippets file
6. Implement tab stop navigation
7. Add snippet search/insertion UI

## Snippet Format (VS Code Compatible)

```json
{
  "Svelte Component": {
    "prefix": "scomp",
    "body": [
      "<script lang=\"ts\">",
      "\tinterface Props {",
      "\t\t${1:propName}: ${2:string};",
      "\t}",
      "",
      "\tlet { ${1:propName} }: Props = \\$props();",
      "</script>",
      "",
      "<div>",
      "\t$0",
      "</div>"
    ],
    "description": "Svelte 5 component with Props"
  }
}
```

## Built-in Snippets

### TypeScript
| Prefix | Description |
|--------|-------------|
| `func` | Function declaration |
| `afunc` | Async function |
| `arrow` | Arrow function |
| `if` | If statement |
| `ifel` | If-else statement |
| `for` | For loop |
| `forof` | For-of loop |
| `forin` | For-in loop |
| `try` | Try-catch block |
| `class` | Class declaration |
| `int` | Interface declaration |
| `type` | Type alias |
| `imp` | Import statement |
| `exp` | Export statement |

### Svelte 5
| Prefix | Description |
|--------|-------------|
| `scomp` | Component with Props |
| `sstate` | $state() declaration |
| `sderived` | $derived() declaration |
| `seffect` | $effect() block |
| `sprops` | $props() destructure |
| `sbindable` | $bindable() prop |
| `ssnippet` | {#snippet} block |
| `seach` | {#each} block |
| `sif` | {#if} block |
| `sawait` | {#await} block |

### React (TSX)
| Prefix | Description |
|--------|-------------|
| `rfc` | React functional component |
| `rus` | useState hook |
| `rue` | useEffect hook |
| `ruc` | useCallback hook |
| `rum` | useMemo hook |
| `rur` | useRef hook |

## UI Design

### Snippet Popup
```
┌──────────────────────────────────────┐
│ func  │ Function declaration         │
│ afunc │ Async function               │
│ arrow │ Arrow function               │
│ class │ Class declaration            │
└──────────────────────────────────────┘
         ↑ shows after typing prefix
```

### Tab Stop Navigation
```
function ${1:name}(${2:params}) {
         ├───────┘         └──────────┤
         │ Tab 1 (active)  │ Tab 2    │
         └─────────────────┴──────────┘

Press Tab to move: $1 → $2 → $0 (final cursor)
```

## CodeMirror Integration

```typescript
import { snippetCompletion, snippet } from "@codemirror/autocomplete";

const snippets = [
  snippetCompletion(
    "function ${name}(${params}) {\n\t${}\n}",
    { label: "func", detail: "Function declaration" }
  ),
];

// Add to completions
const extensions = [
  autocompletion({ override: [mySnippetCompletions] }),
];
```

## Snippet Storage

```
.vscode/
  snippets/
    typescript.json
    svelte.json
    global.json
```

Or in settings:
```json
{
  "snippets": {
    "typescript": { ... },
    "svelte": { ... }
  }
}
```

## Keyboard Shortcuts

- `Tab` - Expand snippet / Next tab stop
- `Shift+Tab` - Previous tab stop
- `Escape` - Exit snippet mode
- `Ctrl+Space` - Show snippet completions

## Priority

MEDIUM - Productivity booster for repetitive patterns
