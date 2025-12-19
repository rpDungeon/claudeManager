# Common Package

Shared schemas, types, and utilities used by both backend and frontend.

## Zod Schema Patterns

### Spread for Inheritance (TypeScript Performance)

Use spread operator on `.shape` to extend schemas - better TSC performance than `.extend()` or `.and()`:

```typescript
import { layoutItemBaseSchema } from "./item.base";

export const layoutItemTerminalSchema = z.object({
  ...layoutItemBaseSchema.shape,
  terminalId: z.string(),
  type: z.literal("terminal"),
});
```

### Always Infer Types from Schemas

Never define types manually - always infer from the Zod schema:

```typescript
// GOOD
export type LayoutContainerSplit = z.infer<typeof layoutContainerSplitSchema>;

// BAD - manual type definition
export type LayoutContainerSplit = {
  id: string;
  childIds: string[];
  // ...
};
```

### Direct Exports

Export directly, don't use separate `export { }` blocks:

```typescript
// GOOD
export const layoutItemSchema = z.discriminatedUnion("type", [...]);
export type LayoutItem = z.infer<typeof layoutItemSchema>;

// BAD
const layoutItemSchema = z.discriminatedUnion("type", [...]);
type LayoutItem = z.infer<typeof layoutItemSchema>;
export { layoutItemSchema };
export type { LayoutItem };
```

### No Unnecessary Re-exports

Don't re-export child module types up the chain. Import directly from source:

```typescript
// GOOD - import from source
import { LayoutItem } from "./item/item.types";

// BAD - re-exporting in parent
// layout.types.ts
export type { LayoutItem } from "./item/item.types";
```

## Layout Schema Structure

The layout system separates **items** (content to display) from **containers** (how they're arranged):

```
layout/
├── layout.types.ts        # Main layout types with LayoutData
├── layout.schema.ts       # Drizzle schema for DB
├── item/                  # Content items (shared between desktop/mobile)
│   ├── item.base.ts       # Base schema with id, label
│   ├── item.types.ts      # Union of all item types
│   ├── item.terminal.ts
│   ├── item.iframe.ts
│   ├── item.image.ts
│   └── item.markdown.ts
└── container/             # Containers organize items
    ├── container.base.ts  # Base schema with id, childIds
    ├── container.types.ts # Union of all container types
    ├── container.tabs.ts  # Tabs container
    └── container.split.ts # Split container
```

### Layout Data Model

```typescript
LayoutData = {
  items: Record<string, LayoutItem>,      // Shared content items
  desktop: LayoutArrangement,             // Desktop arrangement
  mobile: LayoutArrangement,              // Mobile arrangement (defaults to tabs)
}

LayoutArrangement = {
  containers: Record<string, LayoutContainer>,
  rootId: string | null,
}

LayoutContainer = LayoutContainerTabs | LayoutContainerSplit
LayoutItem = LayoutItemTerminal | LayoutItemIframe | LayoutItemImage | LayoutItemMarkdown
```

Items are shared between desktop/mobile. Only the arrangement differs.
Mobile typically uses tabs, desktop can use splits or tabs.
