# Code Actions / Quick Fixes (Ctrl+.)

LSP-powered code actions for quick fixes, refactorings, and source actions.

## Features

### Quick Fixes
- Auto-import missing modules
- Fix spelling errors
- Add missing properties
- Remove unused imports
- Convert to different syntax

### Refactorings
- Extract function
- Extract variable
- Extract constant
- Inline variable
- Move to new file

### Source Actions
- Organize imports
- Sort imports
- Add all missing imports
- Remove all unused imports

## Implementation Steps

1. Create `CodeActionsMenu.component.svelte`
2. Request `textDocument/codeAction` from LSP
3. Show lightbulb icon in gutter when actions available
4. Show menu on click or Ctrl+.
5. Apply selected action (WorkspaceEdit or Command)
6. Add keyboard shortcuts

## UI Design

### Lightbulb in Gutter
```
  1 │ import { foo } from './bar';
💡 2 │ const x = unknownFunction();
  3 │
```

### Code Actions Menu
```
┌────────────────────────────────────────┐
│ 💡 Quick Fix...                        │
├────────────────────────────────────────┤
│ 📥 Add import from './utils'           │
│ 📥 Add import from '@lib/helpers'      │
│ 📝 Declare function 'unknownFunction'  │
├────────────────────────────────────────┤
│ 🔧 Extract to function                 │
│ 🔧 Extract to constant                 │
├────────────────────────────────────────┤
│ 📋 Organize imports                    │
│ 📋 Remove unused imports               │
└────────────────────────────────────────┘
```

## LSP Request

```typescript
const actions = await lspClient.request("textDocument/codeAction", {
  textDocument: { uri: fileUri },
  range: selectionRange,
  context: {
    diagnostics: diagnosticsAtRange,
    only: ["quickfix", "refactor", "source"], // optional filter
    triggerKind: CodeActionTriggerKind.Invoked,
  },
});
```

## Code Action Kinds

```typescript
enum CodeActionKind {
  Empty = "",
  QuickFix = "quickfix",
  Refactor = "refactor",
  RefactorExtract = "refactor.extract",
  RefactorInline = "refactor.inline",
  RefactorRewrite = "refactor.rewrite",
  Source = "source",
  SourceOrganizeImports = "source.organizeImports",
  SourceFixAll = "source.fixAll",
}
```

## Applying Actions

```typescript
interface CodeAction {
  title: string;
  kind?: CodeActionKind;
  diagnostics?: Diagnostic[];
  isPreferred?: boolean;
  edit?: WorkspaceEdit;
  command?: Command;
}

// Apply the action
if (action.edit) {
  applyWorkspaceEdit(action.edit);
}
if (action.command) {
  executeCommand(action.command);
}
```

## Gutter Lightbulb Logic

Show lightbulb when:
- Cursor is on a line with diagnostics that have fixes
- Request code actions proactively on cursor move
- Cache results to avoid repeated requests

```typescript
$effect(() => {
  const line = cursorLine;
  const diagnostics = diagnosticsOnLine(line);
  if (diagnostics.length > 0) {
    requestCodeActions(line);
  }
});
```

## Keyboard Shortcuts

- `Ctrl+.` - Show code actions menu
- `Ctrl+Shift+.` - Show refactor menu only
- Arrow keys - Navigate menu
- Enter - Apply selected action
- Escape - Close menu

## Priority

HIGH - Major productivity feature
