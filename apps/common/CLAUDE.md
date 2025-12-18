# Common Package

Shared schemas, types, and utilities used by both backend and frontend.

## Zod Schema Patterns

### Spread for Inheritance (TypeScript Performance)

Use spread operator on `.shape` to extend schemas - better TSC performance than `.extend()` or `.and()`:

```typescript
import { layoutPaneContentBaseSchema } from "./content.base";

export const layoutPaneContentTerminalSchema = z.object({
  ...layoutPaneContentBaseSchema.shape,
  terminalId: z.string(),
  type: z.literal("terminal"),
});
```

### Always Infer Types from Schemas

Never define types manually - always infer from the Zod schema:

```typescript
// GOOD
export type LayoutPaneSplit = z.infer<typeof layoutPaneSplitSchema>;

// BAD - manual type definition
export type LayoutPaneSplit = {
  id: string;
  parentId: string | null;
  // ...
};
```

### Direct Exports

Export directly, don't use separate `export { }` blocks:

```typescript
// GOOD
export const layoutPaneContentSchema = z.discriminatedUnion("type", [...]);
export type LayoutPaneContent = z.infer<typeof layoutPaneContentSchema>;

// BAD
const layoutPaneContentSchema = z.discriminatedUnion("type", [...]);
type LayoutPaneContent = z.infer<typeof layoutPaneContentSchema>;
export { layoutPaneContentSchema };
export type { LayoutPaneContent };
```

### No Unnecessary Re-exports

Don't re-export child module types up the chain. Import directly from source:

```typescript
// GOOD - import from source
import { LayoutPaneContent } from "./pane/pane.content";

// BAD - re-exporting in parent
// layout.types.ts
export type { LayoutPaneContent } from "./pane/pane.content";
```

## File Structure

Keep related schemas flat, avoid unnecessary nesting:

```
layout/
├── layout.types.ts
├── layout.schema.ts
└── pane/
    ├── pane.types.ts      # Union of content + split
    ├── pane.content.ts    # Discriminated union of content types
    ├── pane.split.ts      # Split node schema
    └── content/
        ├── content.base.ts
        ├── content.terminal.ts
        ├── content.iframe.ts
        ├── content.image.ts
        └── content.markdown.ts
```
