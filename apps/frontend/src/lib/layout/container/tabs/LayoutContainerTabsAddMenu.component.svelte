<!--
@component
name: LayoutContainerTabsAddMenu
type: stupid
styleguide: 1.0.0
description: Dropdown menu for adding new items to a tab container
usage: Render when user clicks the + button in the tab bar
-->
<script lang="ts">
import type { ContextMenuPosition } from "$lib/common/contextMenu/contextMenu.lib";
import { AddItemType } from "./layoutContainerTabsAddMenu.lib";

interface Props {
	position: ContextMenuPosition;
	onAddItem?: (itemType: AddItemType) => void;
	onMenuClose?: () => void;
}

let { position, onAddItem, onMenuClose }: Props = $props();

const menuItems = [
	{
		id: AddItemType.Terminal,
		label: "Terminal",
	},
	{
		id: AddItemType.Iframe,
		label: "Iframe",
	},
];

function handleAction(id: AddItemType) {
	onAddItem?.(id);
	onMenuClose?.();
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		onMenuClose?.();
	}
}

function handleBackdropClick() {
	onMenuClose?.();
}

const rightOffset = $derived(window.innerWidth - position.x);
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="fixed inset-0 z-50"
	onclick={handleBackdropClick}
	onkeydown={handleKeyDown}
	role="presentation"
>
	<div
		class="absolute min-w-[120px] rounded border border-border-default bg-bg-elevated py-1 shadow-lg shadow-black/50"
		style:right="{rightOffset}px"
		style:top="{position.y}px"
		role="menu"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		{#each menuItems as item (item.id)}
			<button
				type="button"
				role="menuitem"
				class="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[11px] transition-colors text-text-primary hover:bg-bg-surface cursor-pointer"
				onclick={() => handleAction(item.id)}
			>
				<span>{item.label}</span>
			</button>
		{/each}
	</div>
</div>
