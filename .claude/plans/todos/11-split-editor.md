# Split Editor

Side-by-side file viewing and editing.

## Features

### Split Directions
- Split right (vertical split)
- Split down (horizontal split)
- Split into group

### Editor Groups
- Multiple editor groups
- Drag tabs between groups
- Close group when empty
- Focus group navigation

### Synchronized Scrolling (optional)
- Link scroll position between splits
- Useful for comparing similar files

## Implementation Steps

1. Extend layout system to support editor splits
2. Add "Split Editor" actions to editor header
3. Implement drag-and-drop between groups
4. Add keyboard shortcuts for split management
5. Handle focus and active editor tracking
6. Add synchronized scrolling option

## UI Design

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ 📄 auth.service.ts         [x] │ 📄 auth.types.ts           [x] │
├─────────────────────────────────┼─────────────────────────────────┤
│ import { AuthTypes } from...   │ export interface AuthToken {   │
│                                 │   token: string;               │
│ export function authenticate() │   expires: number;             │
│ {                               │ }                              │
│   const token: AuthToken = {   │                                │
│     token: generateToken(),     │ export type AuthResponse = {   │
│     expires: Date.now() + 3600, │   success: boolean;            │
│   };                            │   token?: AuthToken;           │
│                                 │   error?: string;              │
└─────────────────────────────────┴─────────────────────────────────┘
```

### Split Button in Editor Header
```
┌────────────────────────────────────────────────────┐
│ 📄 auth.service.ts        [⬜] [⬛] [⎕⎕] [x]       │
│                            │    │    └─ Split right
│                            │    └─ Split down
│                            └─ Maximize/restore
```

## Layout Integration

Current layout system supports splits via `LayoutContainerSplit`:

```typescript
interface LayoutContainerSplit {
  type: "split";
  id: string;
  direction: "horizontal" | "vertical";
  childIds: string[];
  sizes?: number[]; // percentage sizes
}
```

Extend to handle editor-specific splits within a single layout item.

## Data Structure

```typescript
interface EditorGroup {
  id: string;
  editors: EditorTab[];
  activeEditorId: string;
}

interface EditorLayout {
  groups: EditorGroup[];
  splits: SplitNode[];
  activeGroupId: string;
}

interface SplitNode {
  id: string;
  direction: "horizontal" | "vertical";
  children: (string | SplitNode)[]; // group IDs or nested splits
  sizes: number[];
}
```

## Actions

- Split Editor Right
- Split Editor Down
- Move Editor to Next Group
- Move Editor to Previous Group
- Close Editor Group
- Focus Next Editor Group
- Focus Previous Editor Group

## Keyboard Shortcuts

- `Ctrl+\` - Split editor right
- `Ctrl+K Ctrl+\` - Split editor down
- `Ctrl+1/2/3` - Focus editor group 1/2/3
- `Ctrl+K Ctrl+Left/Right` - Move editor to prev/next group
- `Ctrl+K W` - Close editor group

## Priority

MEDIUM - Useful for comparison and reference
