# Emmet

HTML/CSS abbreviation expansion for rapid markup creation.

## Features

### HTML Abbreviations
- Tag expansion: `div` → `<div></div>`
- Classes: `div.container` → `<div class="container"></div>`
- IDs: `div#main` → `<div id="main"></div>`
- Attributes: `a[href="#"]` → `<a href="#"></a>`
- Text: `p{Hello}` → `<p>Hello</p>`
- Nesting: `ul>li*3` → `<ul><li></li><li></li><li></li></ul>`
- Siblings: `h1+p` → `<h1></h1><p></p>`
- Grouping: `(header>nav)+main+footer`
- Numbering: `li.item$*3` → items with classes item1, item2, item3
- Climb up: `^` to go up a level

### CSS Abbreviations
- `m10` → `margin: 10px;`
- `p10-20` → `padding: 10px 20px;`
- `w100%` → `width: 100%;`
- `df` → `display: flex;`
- `jcc` → `justify-content: center;`
- `aic` → `align-items: center;`
- `bgc#fff` → `background-color: #fff;`

### Wrap with Abbreviation
- Select text
- Press Ctrl+Shift+A
- Type abbreviation
- Text is wrapped

## Implementation Steps

1. Install emmet library
2. Integrate with CodeMirror completions
3. Add Tab expansion behavior
4. Implement wrap with abbreviation
5. Support HTML and CSS contexts
6. Handle Svelte/JSX (class → class, not className)

## Available Libraries

```bash
# Option 1: emmet (official)
bun add emmet

# Option 2: @emmetio/codemirror6 (direct integration)
bun add @emmetio/codemirror6
```

## CodeMirror Integration

```typescript
import { emmetConfig, abbreviationTracker } from "@emmetio/codemirror6";

const extensions = [
  emmetConfig.of({
    preview: true,
    // Svelte uses class, not className
    markup: {
      jsx: { className: "class" },
    },
  }),
  abbreviationTracker(),
];
```

## UI Design

### Abbreviation Preview
```
div.container>ul>li.item$*3|
                          │
                          └─ cursor here

Preview tooltip:
┌────────────────────────────────────┐
│ <div class="container">            │
│   <ul>                             │
│     <li class="item1"></li>        │
│     <li class="item2"></li>        │
│     <li class="item3"></li>        │
│   </ul>                            │
│ </div>                             │
└────────────────────────────────────┘
Press Tab to expand
```

### Wrap with Abbreviation
```
1. Select: "Hello World"
2. Ctrl+Shift+A
3. Type: span.highlight
4. Result: <span class="highlight">Hello World</span>
```

## Common Abbreviations Reference

### HTML
| Abbr | Result |
|------|--------|
| `!` | HTML5 boilerplate |
| `div.class` | `<div class="class">` |
| `div#id` | `<div id="id">` |
| `ul>li*5` | ul with 5 li |
| `table>tr*3>td*4` | 3x4 table |
| `form:post` | `<form method="post">` |
| `input:email` | `<input type="email">` |
| `btn` | `<button>` |
| `a:link` | `<a href="http://">` |

### CSS
| Abbr | Result |
|------|--------|
| `m0` | `margin: 0;` |
| `p10` | `padding: 10px;` |
| `w100` | `width: 100px;` |
| `h50%` | `height: 50%;` |
| `df` | `display: flex;` |
| `dg` | `display: grid;` |
| `dn` | `display: none;` |
| `fz16` | `font-size: 16px;` |
| `fw700` | `font-weight: 700;` |
| `tac` | `text-align: center;` |
| `pos:r` | `position: relative;` |
| `bgc` | `background-color: ;` |

## Context Detection

Emmet should work in:
- HTML files
- Svelte template section
- JSX/TSX
- CSS files
- Style blocks in Svelte/Vue

```typescript
function shouldEnableEmmet(context: EditorContext): boolean {
  const { language, syntaxNode } = context;

  // HTML contexts
  if (language === "html") return true;
  if (language === "svelte" && isInTemplate(syntaxNode)) return true;
  if (language === "tsx" && isInJsxElement(syntaxNode)) return true;

  // CSS contexts
  if (language === "css") return true;
  if (syntaxNode.name === "StyleSheet") return true;

  return false;
}
```

## Keyboard Shortcuts

- `Tab` - Expand abbreviation
- `Ctrl+Shift+A` - Wrap with abbreviation
- `Ctrl+Shift+/` - Toggle comment (HTML)

## Settings

```typescript
interface EmmetSettings {
  enabled: boolean;
  showPreview: boolean;
  triggerExpansionOnTab: boolean;
  excludeLanguages: string[];
}
```

## Priority

LOW-MEDIUM - Nice productivity boost for HTML/CSS heavy work
