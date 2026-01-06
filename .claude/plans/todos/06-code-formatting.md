# Code Formatting

Format code using project linter/formatter (Biome, Prettier, ESLint).

## Features

### Format Document
- `Shift+Alt+F` - Format entire file
- Uses project's configured formatter
- Respects `.prettierrc`, `biome.json`, etc.

### Format Selection
- Format only selected code
- Maintains surrounding context

### Format on Save
- Toggle in settings
- Auto-format when saving file

### Format on Paste
- Toggle in settings
- Format pasted code to match indentation

## Implementation Steps

1. Detect project formatter (Biome, Prettier, ESLint)
2. Create backend API endpoint for formatting
3. Send file content, receive formatted content
4. Apply formatting to editor
5. Add keyboard shortcuts
6. Add settings toggles
7. Integrate with save flow

## Backend API

```typescript
// POST /api/format
{
  filePath: string;
  content: string;
  language: string;
  selection?: { start: number; end: number };
}

// Response
{
  formatted: string;
  // or for selection
  formattedSelection: string;
}
```

## Formatter Detection

Priority order:
1. Biome (`biome.json` or `biome.jsonc`)
2. Prettier (`.prettierrc`, `prettier.config.js`)
3. ESLint with `--fix` (`eslint.config.js`)
4. dprint (`dprint.json`)

## Project Linter Integration

Since this project uses Biome:

```bash
# Format single file
bunx biome format --write path/to/file.ts

# Format stdin
bunx biome format --stdin-file-path=path/to/file.ts < content
```

## Settings

```typescript
interface FormattingSettings {
  formatOnSave: boolean;
  formatOnPaste: boolean;
  defaultFormatter: "biome" | "prettier" | "eslint" | "auto";
}
```

## Keyboard Shortcuts

- `Shift+Alt+F` - Format document
- `Ctrl+K Ctrl+F` - Format selection

## Error Handling

- Show toast on format error
- Display formatter errors in Problems panel
- Graceful fallback if formatter not found

## Priority

HIGH - Essential for code quality and consistency
