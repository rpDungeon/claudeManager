# Symbols Icon Integration Plan

## Status: READY TO IMPLEMENT

## Source
- Repo: https://github.com/miguelsolorio/vscode-symbols
- License: MIT
- Already cloned at: `/tmp/vscode-symbols` (re-clone if missing)

## Key Finding
VSCode does ALL mapping logic. Extension just provides JSON. We must reimplement the resolution algorithm.

## VSCode's Precedence Order (must match exactly)
1. `fileNames[filename]` - Exact filename match (e.g., "package.json")
2. `fileExtensions[ext]` - Extension match, **longest first** (e.g., "d.ts" before "ts")
3. `languageIds[langId]` - Language ID (skip for now)
4. `file` - Default fallback

For folders:
1. `folderNames[foldername]` - Exact folder name
2. `folder` - Default fallback

## Multi-Part Extension Logic
File "types.d.ts" → check extensions in order: ["d.ts", "ts"] (longest first)

## Files to Create

### 1. Copy SVGs to static folder
```bash
# Re-clone if needed
cd /tmp && rm -rf vscode-symbols && git clone --depth 1 https://github.com/miguelsolorio/vscode-symbols.git

# Copy to project
mkdir -p /mnt/claude/personal/claudeManager-dev/apps/frontend/static/icons/symbols
cp -r /tmp/vscode-symbols/src/icons/files /mnt/claude/personal/claudeManager-dev/apps/frontend/static/icons/symbols/
cp -r /tmp/vscode-symbols/src/icons/folders /mnt/claude/personal/claudeManager-dev/apps/frontend/static/icons/symbols/
```

### 2. Copy theme JSON
```bash
cp /tmp/vscode-symbols/src/symbol-icon-theme.json /mnt/claude/personal/claudeManager-dev/apps/frontend/src/lib/icons/
```

### 3. Create resolver: `apps/frontend/src/lib/icons/fileIcon.resolver.ts`

```typescript
import themeData from "./symbol-icon-theme.json";

interface IconDefinition {
  iconPath: string;
}

interface IconTheme {
  iconDefinitions: Record<string, IconDefinition>;
  file: string;
  folder: string;
  fileNames: Record<string, string>;
  fileExtensions: Record<string, string>;
  folderNames: Record<string, string>;
  languageIds: Record<string, string>;
}

const theme = themeData as IconTheme;

export function fileIconResolve(filename: string, isFolder: boolean): string {
  const lowerName = filename.toLowerCase();

  if (isFolder) {
    if (theme.folderNames[lowerName]) {
      return theme.folderNames[lowerName];
    }
    return theme.folder;
  }

  // 1. Check exact filename (case-insensitive first, then original)
  if (theme.fileNames[lowerName]) {
    return theme.fileNames[lowerName];
  }
  if (theme.fileNames[filename]) {
    return theme.fileNames[filename];
  }

  // 2. Check extensions (longest match first)
  const extensions = fileExtensionsExtract(filename);
  for (const ext of extensions) {
    if (theme.fileExtensions[ext]) {
      return theme.fileExtensions[ext];
    }
  }

  // 3. Fallback
  return theme.file;
}

function fileExtensionsExtract(filename: string): string[] {
  const parts = filename.split(".");
  if (parts.length <= 1) return [];

  const extensions: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    extensions.push(parts.slice(i).join(".").toLowerCase());
  }
  return extensions;
}

export function fileIconPathGet(iconId: string, isFolder: boolean): string {
  const def = theme.iconDefinitions[iconId];
  if (!def) {
    const fallbackId = isFolder ? theme.folder : theme.file;
    const fallbackDef = theme.iconDefinitions[fallbackId];
    return fallbackDef?.iconPath.replace("./icons/", "/icons/symbols/") ?? "/icons/symbols/files/document.svg";
  }
  return def.iconPath.replace("./icons/", "/icons/symbols/");
}
```

### 4. Create component: `apps/frontend/src/lib/icons/FileIcon.component.svelte`

```svelte
<script lang="ts">
import { fileIconResolve, fileIconPathGet } from "./fileIcon.resolver";

interface Props {
  filename: string;
  isFolder?: boolean;
  size?: number;
}

let { filename, isFolder = false, size = 16 }: Props = $props();

const iconId = $derived(fileIconResolve(filename, isFolder));
const iconPath = $derived(fileIconPathGet(iconId, isFolder));
</script>

<img src={iconPath} alt="" width={size} height={size} class="shrink-0" />
```

### 5. Update `apps/frontend/src/lib/fileTree/item/FileTreeItem.component.svelte`

Replace lines 162-170 (the emoji icon section):

```svelte
<!-- OLD -->
<span class="flex size-[13px] shrink-0 items-center justify-center text-[11px] text-text-secondary">
  {#if isError}
    <span class="text-terminal-red">🚫</span>
  {:else if isFolder}
    <span class:text-amber-500={isExpanded}>📁</span>
  {:else}
    <span>📄</span>
  {/if}
</span>

<!-- NEW -->
<span class="flex size-[13px] shrink-0 items-center justify-center">
  {#if isError}
    <span class="text-[11px] text-terminal-red">🚫</span>
  {:else}
    <FileIcon filename={name} {isFolder} size={13} />
  {/if}
</span>
```

Add import at top:
```svelte
import FileIcon from "$lib/icons/FileIcon.component.svelte";
```

### 6. TypeScript config for JSON import

In `apps/frontend/tsconfig.json`, ensure:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

## Statistics
- 225 file icons
- 98 folder icons
- 715 filename mappings
- 385 extension mappings
- 137 folder name mappings

## Test Cases After Implementation
1. `package.json` → node icon
2. `vite.config.ts` → vite icon
3. `types.d.ts` → ts-types icon (not ts)
4. `Button.stories.svelte` → storybook icon
5. `src/` folder → orange-code folder
6. `node_modules/` folder → node-modules folder
7. Unknown file `foo.xyz` → document icon
8. Unknown folder `random/` → default folder icon
