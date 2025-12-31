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
import { AddItemType } from "./container/tabs/layoutContainerTabsAddMenu.lib";
import LayoutContainer_ from "./container/_LayoutContainer.svelte";
import LayoutItem_ from "./item/_LayoutItem.svelte";

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
}: Props = $props();

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
		<div class="flex h-full items-center justify-center text-text-tertiary text-xs">
			No layout configured
		</div>
	{/if}
</div>
