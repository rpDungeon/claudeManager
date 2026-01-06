# Rename Symbol (F2)

LSP-powered symbol renaming across files.

## Features

### Rename Flow
1. Place cursor on symbol
2. Press F2
3. Inline input appears with current name
4. Type new name
5. Preview all changes
6. Confirm to apply

### Preview Changes
- Show all files affected
- Show each occurrence
- Allow excluding specific occurrences
- Show diff preview

### Validation
- Check for naming conflicts
- Validate new name syntax
- Show errors inline

## Implementation Steps

1. Create rename input UI (inline at symbol)
2. Request `textDocument/prepareRename` to validate
3. Request `textDocument/rename` for changes
4. Show preview modal with all changes
5. Apply WorkspaceEdit
6. Handle errors gracefully

## UI Design

### Inline Input
```
const [userName] = useState();
      └─[userName____]──┘
          ↑ cursor here, type new name
```

### Preview Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Rename 'userName' to 'currentUser'                          │
│ 5 occurrences in 3 files                      [Cancel] [OK] │
├─────────────────────────────────────────────────────────────┤
│ ☑ src/auth/auth.service.ts (2 occurrences)                  │
│   - const [userName] = useState();                          │
│   + const [currentUser] = useState();                       │
│   - console.log(userName);                                  │
│   + console.log(currentUser);                               │
│                                                             │
│ ☑ src/components/Header.svelte (2 occurrences)              │
│   - <span>{userName}</span>                                 │
│   + <span>{currentUser}</span>                              │
│                                                             │
│ ☑ src/types/user.ts (1 occurrence)                          │
│   - userName: string;                                       │
│   + currentUser: string;                                    │
└─────────────────────────────────────────────────────────────┘
```

## LSP Requests

### Prepare Rename
```typescript
const result = await lspClient.request("textDocument/prepareRename", {
  textDocument: { uri: fileUri },
  position: cursorPosition,
});
// Returns: { range: Range, placeholder: string } or null if not renamable
```

### Rename
```typescript
const workspaceEdit = await lspClient.request("textDocument/rename", {
  textDocument: { uri: fileUri },
  position: cursorPosition,
  newName: newName,
});
// Returns: WorkspaceEdit with changes to apply
```

### Apply WorkspaceEdit
```typescript
interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] };
  documentChanges?: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[];
}
```

## Error Handling

- Show error if rename not possible at position
- Show error if new name is invalid
- Show conflict warning if name already exists
- Undo support for entire rename operation

## Keyboard Shortcuts

- `F2` - Start rename
- `Enter` - Confirm rename
- `Escape` - Cancel rename
- `Shift+Enter` - Rename without preview (if confident)

## Priority

HIGH - Essential refactoring feature
