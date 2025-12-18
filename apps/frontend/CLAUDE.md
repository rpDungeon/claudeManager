# Frontend App

SvelteKit frontend with Svelte 5 runes, TailwindCSS, and Storybook.

## Component Patterns

### File Structure

Each component lives in its own directory:

```
src/lib/featureName/
├── FeatureName.component.svelte    # Main component
├── FeatureName.stories.svelte      # Storybook stories (Svelte CSF v5)
├── featureName.lib.ts              # Enums, types, constants, helpers
└── _InternalChild.svelte           # Internal sub-components (underscore prefix)
```

**NO barrel files (index.ts)** - use direct imports.

### JSDoc Component Header

Every `.component.svelte` file MUST start with this JSDoc block:

```svelte
<!--
@component
name: ComponentName
type: smart|stupid
styleguide: 1.0.0
description: One-line description of what this component does
usage: When and how to use this component
-->
```

### Props Pattern

Use inline interface with `$props()`:

```svelte
<script lang="ts">
interface Props {
	title?: string;
	isActive?: boolean;
	onclick?: (event: MouseEvent) => void;
}

let {
	title = "default",
	isActive = false,
	onclick,
}: Props = $props();
</script>
```

### Reactivity (Svelte 5 Runes)

```svelte
<script lang="ts">
let count = $state(0);
let doubled = $derived(count * 2);

$effect(() => {
	console.log("count changed:", count);
});
</script>
```

## Storybook (Svelte CSF v5)

Stories use native Svelte syntax with `@storybook/addon-svelte-csf`:

```svelte
<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import MyComponent from "./MyComponent.component.svelte";

const { Story } = defineMeta({
	component: MyComponent,
	parameters: {
		backgrounds: {
			default: "void",
			values: [{ name: "void", value: "#0a0a0a" }],
		},
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Category/ComponentName",
});
</script>

{#snippet template(args: any)}
	<div class="wrapper">
		<MyComponent {...args} />
	</div>
{/snippet}

<Story name="Default" args={{ prop: "value" }} {template} />
<Story name="Active" args={{ prop: "value", isActive: true }} {template} />
```

## Tailwind Theme (CRT Aesthetic)

Custom theme defined in `src/routes/layout.css`:

### Background Colors
- `bg-bg-void` - Deepest black (#0a0a0a)
- `bg-bg-surface` - Surface level (#111111)
- `bg-bg-elevated` - Elevated elements (#1a1a1a)

### Terminal Colors
- `bg-terminal-green` / `text-terminal-green` - CRT green (#00ff41)
- `bg-terminal-amber` / `text-terminal-amber` - Warning amber (#ffb000)
- `bg-terminal-cyan` / `text-terminal-cyan` - Info cyan (#00e5ff)
- `bg-terminal-red` / `text-terminal-red` - Error red (#ff3333)

### Text Colors
- `text-text-primary` - Main text (#e0e0e0)
- `text-text-secondary` - Secondary (#888888)
- `text-text-tertiary` - Muted (#555555)

### Border Colors
- `border-border-default` - Default border (#222222)
- `border-border-active` - Active/hover (#333333)

### Font
- `font-mono` - IBM Plex Mono (self-hosted in `src/lib/assets/fonts/`)

## Enum Pattern

Use TypeScript enums with Tailwind class maps:

```typescript
// featureName.lib.ts
export enum StatusColor {
	Green = "green",
	Red = "red",
}

export const statusColorMap: Record<StatusColor, string> = {
	[StatusColor.Green]: "bg-terminal-green shadow-[0_0_6px_var(--color-terminal-green)]",
	[StatusColor.Red]: "bg-terminal-red shadow-[0_0_6px_var(--color-terminal-red)]",
};
```

Usage in component:

```svelte
<script lang="ts">
import { StatusColor, statusColorMap } from "./featureName.lib";

let { statusColor = StatusColor.Green }: Props = $props();
const statusClasses = $derived(statusColorMap[statusColor]);
</script>

<span class="size-1 rounded-full {statusClasses}"></span>
```

## Common Sizes

- Status bar height: `h-[22px]`
- Header height: `h-5` (20px)
- Status indicator: `size-1` (4px)
- Font sizes: `text-[10px]`, `text-[9px]` for small text
- Gaps: `gap-1.5`, `gap-4`
- Padding: `px-2`, `px-3`, `p-3`

## CRT Effects

Scanline overlay for terminal body:

```css
.scanlines {
	background: repeating-linear-gradient(
		0deg,
		rgba(0, 255, 65, 0.03) 0px,
		transparent 1px,
		transparent 2px,
		rgba(0, 255, 65, 0.03) 3px
	);
}
```

Glow effect for status indicators:

```css
shadow-[0_0_6px_var(--color-terminal-green)]
```

## Running Storybook

```bash
bun run dev:frontend   # Runs SvelteKit dev server
bun run storybook      # Runs Storybook (from apps/frontend)
```
