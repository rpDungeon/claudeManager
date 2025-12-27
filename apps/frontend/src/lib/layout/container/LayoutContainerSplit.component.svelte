<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutContainerSplit
type: stupid
styleguide: 1.0.0
description: Renders a split pane container using paneforge
usage: Pass container data with childIds and sizes to render resizable split panes
-->
<script lang="ts">
import type { LayoutContainerSplit } from "@claude-manager/common/src/layout/container/container.split";
import type { LayoutContainer } from "@claude-manager/common/src/layout/container/container.types";
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import type { LayoutDropZonePosition } from "../dropzone/dropzone.lib";
import { PaneGroup, Pane, PaneResizer } from "paneforge";
import LayoutContainer_ from "./_LayoutContainer.svelte";
import LayoutItem_ from "../item/_LayoutItem.svelte";

interface Props {
	container: LayoutContainerSplit;
	containers: Record<string, LayoutContainer>;
	items: Record<string, LayoutItem>;
	activeItemId?: string | null;
	onSplitResize?: (containerId: string, sizes: number[]) => void;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onItemSelect?: (itemId: string) => void;
	onItemReorder?: (containerId: string, fromItemId: string, toItemId: string) => void;
	onItemDrop?: (droppedItemId: string, targetContainerId: string) => void;
	onSplitDrop?: (droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
	onAddItem?: (containerId: string) => void;
}

let {
	container,
	containers,
	items,
	activeItemId = null,
	onSplitResize,
	onTabSelect,
	onItemSelect,
	onItemReorder,
	onItemDrop,
	onSplitDrop,
	onAddItem,
}: Props = $props();

function handleLayoutChange(sizes: number[]) {
	onSplitResize?.(container.id, sizes);
}

function resolveChild(childId: string):
	| {
			type: "container";
			data: LayoutContainer;
	  }
	| {
			type: "item";
			data: LayoutItem;
	  }
	| null {
	const childContainer = containers[childId];
	if (childContainer) {
		return {
			data: childContainer,
			type: "container",
		};
	}
	const item = items[childId];
	if (item) {
		return {
			data: item,
			type: "item",
		};
	}
	return null;
}

function handleItemClick(itemId: string) {
	return (_event: MouseEvent) => {
		onItemSelect?.(itemId);
	};
}
</script>

<PaneGroup
	direction={container.direction}
	onLayoutChange={handleLayoutChange}
	class="h-full"
>
	{#each container.childIds as childId, index (childId)}
		{@const child = resolveChild(childId)}
		{@const size = container.sizes[index] ?? 50}

		{#if index > 0}
			<PaneResizer class="pane-resizer" />
		{/if}

		<Pane defaultSize={size}>
			{#if child?.type === "container"}
				<LayoutContainer_
					container={child.data}
					{containers}
					{items}
					{activeItemId}
					{onSplitResize}
					{onTabSelect}
					{onItemSelect}
					{onItemReorder}
					{onItemDrop}
					{onSplitDrop}
					{onAddItem}
				/>
			{:else if child?.type === "item"}
				<LayoutItem_
					item={child.data}
					isActive={activeItemId === childId}
					draggable={true}
					isDropTarget={true}
					onclick={handleItemClick(childId)}
				/>
			{:else}
				<div
					class="flex h-full items-center justify-center bg-bg-void text-text-tertiary text-[10px]"
				>
					Missing: {childId}
				</div>
			{/if}
		</Pane>
	{/each}
</PaneGroup>

<style>
	:global(.pane-resizer) {
		background: var(--color-border-default);
		transition: background-color 150ms;
	}

	:global(.pane-resizer:hover),
	:global(.pane-resizer:focus) {
		background: var(--color-terminal-green);
	}

	:global(.pane-resizer[data-direction="horizontal"]) {
		width: 1px;
		cursor: col-resize;
	}

	:global(.pane-resizer[data-direction="vertical"]) {
		height: 1px;
		cursor: row-resize;
	}
</style>
