<!-- Review pending by Autumnlight -->
<!--
@component
name: Layout
type: stupid
styleguide: 1.0.0
description: Renders a complete layout from LayoutData, supporting splits and tabs
usage: Pass layoutData to render the full layout tree with items and containers
-->
<script lang="ts">
import type { LayoutContainer } from "@claude-manager/common/src/layout/container/container.types";
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { LayoutDropZonePosition } from "./dropzone/dropzone.lib";
import type { ContextMenuPosition } from "$lib/common/contextMenu/contextMenu.lib";
import { AddItemType } from "./container/tabs/layoutContainerTabsAddMenu.lib";
import LayoutContainer_ from "./container/_LayoutContainer.svelte";
import LayoutItem_ from "./item/_LayoutItem.svelte";
import LayoutContainerTabsAddMenu from "./container/tabs/LayoutContainerTabsAddMenu.component.svelte";

type ResolvedRoot =
	| {
			type: "container";
			data: LayoutContainer;
	  }
	| {
			type: "item";
			data: LayoutItem;
	  }
	| null;

interface Props {
	data: LayoutData;
	mode?: "desktop" | "mobile";
	activeItemId?: string | null;
	onSplitResize?: (containerId: string, sizes: number[]) => void;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onItemSelect?: (itemId: string) => void;
	onItemReorder?: (containerId: string, fromItemId: string, toItemId: string) => void;
	onItemDrop?: (droppedItemId: string, targetContainerId: string) => void;
	onSplitDrop?: (droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
	onAddItem?: (containerId: string, itemType: AddItemType) => void;
	onItemRename?: (containerId: string, itemId: string) => void;
	onItemChangeUrl?: (containerId: string, itemId: string) => void;
	onItemClose?: (containerId: string, itemId: string) => void;
	onAddItemToEmptyLayout?: (itemType: AddItemType) => void;
}

let {
	data,
	mode = "desktop",
	activeItemId = null,
	onSplitResize,
	onTabSelect,
	onItemSelect,
	onItemReorder,
	onItemDrop,
	onSplitDrop,
	onAddItem,
	onItemRename,
	onItemChangeUrl,
	onItemClose,
	onAddItemToEmptyLayout,
}: Props = $props();

let addMenuPosition = $state<ContextMenuPosition | null>(null);

function handleAddButtonClick(event: MouseEvent) {
	const button = event.currentTarget as HTMLButtonElement;
	const rect = button.getBoundingClientRect();
	addMenuPosition = {
		x: rect.right,
		y: rect.bottom + 4,
	};
}

function handleAddItem(itemType: AddItemType) {
	onAddItemToEmptyLayout?.(itemType);
	addMenuPosition = null;
}

function handleMenuClose() {
	addMenuPosition = null;
}

const arrangement = $derived(mode === "desktop" ? data.desktop : data.mobile);
const rootId = $derived(arrangement.rootId);

function resolveRoot(): ResolvedRoot {
	if (!rootId) return null;

	const container = arrangement.containers[rootId];
	if (container) {
		return {
			data: container,
			type: "container",
		};
	}

	const item = data.items[rootId];
	if (item) {
		return {
			data: item,
			type: "item",
		};
	}

	return null;
}

const root = $derived(resolveRoot());

function handleItemClick(itemId: string) {
	return (_event: MouseEvent) => {
		onItemSelect?.(itemId);
	};
}
</script>

<div class="h-full w-full overflow-hidden bg-bg-void">
	{#if root?.type === "container"}
		<LayoutContainer_
			container={root.data}
			containers={arrangement.containers}
			items={data.items}
			{activeItemId}
			{onSplitResize}
			{onTabSelect}
			{onItemSelect}
			{onItemReorder}
			{onItemDrop}
			{onSplitDrop}
			{onAddItem}
			{onItemRename}
			{onItemChangeUrl}
			{onItemClose}
		/>
	{:else if root?.type === "item"}
		<LayoutItem_
			item={root.data}
			isActive={activeItemId === rootId}
			draggable={true}
			onclick={handleItemClick(rootId!)}
		/>
	{:else}
		<div class="flex h-full flex-col items-center justify-center gap-3 text-text-tertiary text-xs">
			<span>No layout configured</span>
			{#if onAddItemToEmptyLayout}
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded border border-border-default bg-bg-elevated text-text-secondary transition-colors hover:border-terminal-green hover:text-terminal-green cursor-pointer"
					onclick={handleAddButtonClick}
					title="Add item"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</button>
			{/if}
		</div>
		{#if addMenuPosition}
			<LayoutContainerTabsAddMenu
				position={addMenuPosition}
				onAddItem={handleAddItem}
				onMenuClose={handleMenuClose}
			/>
		{/if}
	{/if}
</div>
