<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutContainerTabs
type: stupid
styleguide: 1.0.0
description: Renders a tabbed container with drag-and-drop reordering
usage: Pass container data with childIds to render tabs with content switching and DnD
-->
<script lang="ts">
import type { LayoutContainerTabs } from "@claude-manager/common/src/layout/container/container.tabs";
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import type { LayoutDropZonePosition } from "../dropzone/dropzone.lib";
import LayoutItem_ from "../item/_LayoutItem.svelte";
import LayoutDropZone from "../dropzone/LayoutDropZone.component.svelte";

interface Props {
	container: LayoutContainerTabs;
	items: Record<string, LayoutItem>;
	activeItemId?: string | null;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onItemSelect?: (itemId: string) => void;
	onItemReorder?: (containerId: string, fromItemId: string, toItemId: string) => void;
	onItemDrop?: (droppedItemId: string, targetContainerId: string) => void;
	onSplitDrop?: (droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
	onAddItem?: (containerId: string) => void;
}

let {
	container,
	items,
	activeItemId = null,
	onTabSelect,
	onItemSelect,
	onItemReorder,
	onItemDrop,
	onSplitDrop,
	onAddItem,
}: Props = $props();

const activeTabId = $derived(container.activeTabId ?? container.childIds[0] ?? null);

let dragOverTabId = $state<string | null>(null);
let isDragOverContent = $state(false);

function handleTabClick(itemId: string) {
	onTabSelect?.(container.id, itemId);
}

function handleItemClick(itemId: string) {
	return (_event: MouseEvent) => {
		onItemSelect?.(itemId);
	};
}

function handleTabDragStart(itemId: string, event: DragEvent) {
	event.dataTransfer?.setData("text/plain", itemId);
	event.dataTransfer?.setData("application/x-layout-item", itemId);
	event.dataTransfer?.setData("application/x-source-container", container.id);

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
	}
}

function handleTabDragOver(itemId: string, event: DragEvent) {
	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	dragOverTabId = itemId;
}

function handleTabDragLeave(_itemId: string, _event: DragEvent) {
	dragOverTabId = null;
}

function handleTabDrop(targetItemId: string, event: DragEvent) {
	event.preventDefault();
	dragOverTabId = null;

	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	const sourceContainerId = event.dataTransfer?.getData("application/x-source-container");

	if (!droppedItemId || droppedItemId === targetItemId) return;

	if (sourceContainerId === container.id) {
		onItemReorder?.(container.id, droppedItemId, targetItemId);
	} else {
		onItemDrop?.(droppedItemId, container.id);
	}
}

function handleContainerDragOver(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}
}

function handleContainerDrop(event: DragEvent) {
	event.preventDefault();
	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	if (droppedItemId) {
		onItemDrop?.(droppedItemId, container.id);
	}
}

function handleContentDragEnter(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer?.types.includes("application/x-layout-item")) {
		isDragOverContent = true;
	}
}

function handleContentDragOver(event: DragEvent) {
	event.preventDefault();
	if (!isDragOverContent && event.dataTransfer?.types.includes("application/x-layout-item")) {
		isDragOverContent = true;
	}
}

function handleContentDragLeave(event: DragEvent) {
	const relatedTarget = event.relatedTarget as Node | null;
	const currentTarget = event.currentTarget as Node;
	if (relatedTarget && currentTarget.contains(relatedTarget)) {
		return;
	}
	isDragOverContent = false;
}

function handleDropZoneDrop(containerId: string, zone: LayoutDropZonePosition, event: DragEvent) {
	isDragOverContent = false;

	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	if (!droppedItemId) return;

	if (zone === "center") {
		onItemDrop?.(droppedItemId, containerId);
	} else {
		onSplitDrop?.(droppedItemId, containerId, zone);
	}
}
</script>

<div class="relative flex h-full flex-col">
	<div
		class="flex h-5 items-center gap-0.5 border-b border-border-default bg-bg-surface px-1"
		role="tablist"
		tabindex="-1"
		ondragover={handleContainerDragOver}
		ondrop={handleContainerDrop}
	>
		{#each container.childIds as childId (childId)}
			{@const item = items[childId]}
			{#if item}
				<button
					type="button"
					role="tab"
					aria-selected={activeTabId === childId}
					class="px-2 py-0.5 text-[10px] transition-colors duration-100 cursor-grab
						{activeTabId === childId
							? 'bg-bg-elevated text-text-primary'
							: 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/50'}
						{dragOverTabId === childId ? 'ring-1 ring-terminal-green ring-inset' : ''}"
					draggable="true"
					onclick={() => handleTabClick(childId)}
					ondragstart={(e) => handleTabDragStart(childId, e)}
					ondragover={(e) => handleTabDragOver(childId, e)}
					ondragleave={(e) => handleTabDragLeave(childId, e)}
					ondrop={(e) => handleTabDrop(childId, e)}
				>
					{item.label ?? item.type}
				</button>
			{/if}
		{/each}

		{#if onAddItem}
			<button
				type="button"
				class="ml-1 flex size-4 items-center justify-center text-[10px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated/50 transition-colors duration-100"
				onclick={() => onAddItem(container.id)}
				title="Add terminal"
			>
				+
			</button>
		{/if}
	</div>

	<div
		class="relative flex-1 overflow-hidden"
		ondragenter={handleContentDragEnter}
		ondragover={handleContentDragOver}
		ondragleave={handleContentDragLeave}
		role="region"
	>
		{#each container.childIds as childId (childId)}
			{@const item = items[childId]}
			{#if item && activeTabId === childId}
				<LayoutItem_
					{item}
					isActive={activeItemId === childId}
					draggable={true}
					isDropTarget={true}
					onclick={handleItemClick(childId)}
					onDragStart={handleTabDragStart}
					onDrop={(droppedId, _targetId, e) => handleTabDrop(childId, e)}
				/>
			{/if}
		{/each}

		<LayoutDropZone
			containerId={container.id}
			isVisible={isDragOverContent}
			onDrop={handleDropZoneDrop}
		/>
	</div>
</div>
