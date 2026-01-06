# Minimap

Visual overview of the file on the right side of the editor.

## NOTE

**ASK USER BEFORE IMPLEMENTING** - Use AskUserQuestion tool to confirm:
1. Desired position (right side vs left side)
2. Width preference
3. Whether to show on all files or only large files
4. Click behavior (scroll vs jump)

## Features

- Scaled-down view of entire file
- Highlights current viewport position
- Click to navigate
- Hover shows preview
- Syntax highlighting in minimap

## Available Package

```bash
bun add @codemirror/minimap
```

## Implementation Steps

1. **ASK USER** about preferences (see note above)
2. Install `@codemirror/minimap`
3. Configure minimap extension
4. Style to match CRT theme
5. Add toggle option in settings

## Configuration Options

```typescript
import { showMinimap } from "@codemirror/minimap";

const minimapExtension = showMinimap.compute(["doc"], (state) => {
  return {
    // Minimap configuration
    create: () => ({ dom: document.createElement("div") }),
    displayText: "blocks", // or "characters"
    showOverlay: "always", // or "mouse-over"
  };
});
```

## UI Considerations

- Width: ~60-100px typical
- Should blend with CRT theme
- Green tint for consistency
- Current viewport highlighted

## Priority

MEDIUM - Visual enhancement, not critical for functionality
