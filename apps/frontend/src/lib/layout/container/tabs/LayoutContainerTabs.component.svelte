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
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import type { LayoutDropZonePosition } from "../../dropzone/dropzone.lib";
import type { ContextMenuPosition } from "$lib/common/contextMenu/contextMenu.lib";
import { FILETREE_FILE_DRAG_MIME } from "$lib/fileTree/fileTree.lib";
import { terminalInstanceAttentionClear, terminalInstanceGet } from "$lib/terminal/terminal.service.svelte";
import LayoutItem_ from "../../item/_LayoutItem.svelte";
import LayoutDropZone from "../../dropzone/LayoutDropZone.component.svelte";
import LayoutContainerTabsContextMenu from "./LayoutContainerTabsContextMenu.component.svelte";
import LayoutContainerTabsAddMenu from "./LayoutContainerTabsAddMenu.component.svelte";
import { AddItemType } from "./layoutContainerTabsAddMenu.lib";

interface Props {
	container: LayoutContainerTabs;
	items: Record<string, LayoutItem>;
	projectPath?: string;
	activeItemId?: string | null;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onItemSelect?: (itemId: string) => void;
	onItemReorder?: (containerId: string, fromItemId: string, toItemId: string) => void;
	onItemDrop?: (droppedItemId: string, targetContainerId: string) => void;
	onSplitDrop?: (droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
	onAddItem?: (containerId: string, itemType: AddItemType) => void;
	onItemRename?: (containerId: string, itemId: string) => void;
	onItemChangeUrl?: (containerId: string, itemId: string) => void;
	onItemClose?: (containerId: string, itemId: string) => void;
	onFileDrop?: (filePath: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
}

let {
	container,
	items,
	projectPath,
	activeItemId = null,
	onTabSelect,
	onItemSelect,
	onItemReorder,
	onItemDrop,
	onSplitDrop,
	onAddItem,
	onItemRename,
	onItemChangeUrl,
	onItemClose,
	onFileDrop,
}: Props = $props();

function dragHasDroppableData(dataTransfer: DataTransfer): boolean {
	return (
		dataTransfer.types.includes("application/x-layout-item") || dataTransfer.types.includes(FILETREE_FILE_DRAG_MIME)
	);
}

const activeTabId = $derived(container.activeTabId ?? container.childIds[0] ?? null);

$effect(() => {
	if (activeItemId) {
		const item = items[activeItemId];
		if (item?.type === "terminal") {
			terminalInstanceAttentionClear(activeItemId as TerminalId);
		}
	}
});

let dragOverTabId = $state<string | null>(null);
let isDragOverContent = $state(false);
let contextMenuPosition = $state<ContextMenuPosition | null>(null);
let contextMenuItemId = $state<string | null>(null);
let addMenuPosition = $state<ContextMenuPosition | null>(null);

let tabListEl = $state<HTMLElement | null>(null);
let canScrollLeft = $state(false);
let canScrollRight = $state(false);

function updateScrollState() {
	if (!tabListEl) return;
	const { scrollLeft, scrollWidth, clientWidth } = tabListEl;
	canScrollLeft = scrollLeft > 0;
	canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
}

$effect(() => {
	if (!tabListEl) return;

	updateScrollState();

	const resizeObserver = new ResizeObserver(() => updateScrollState());
	resizeObserver.observe(tabListEl);

	return () => resizeObserver.disconnect();
});

$effect(() => {
	container.childIds;
	updateScrollState();
});

function handleTabClick(itemId: string) {
	const item = items[itemId];
	if (item?.type === "terminal") {
		terminalInstanceAttentionClear(itemId as TerminalId);
	}
	onTabSelect?.(container.id, itemId);
}

function handleItemClick(itemId: string) {
	return (_event: MouseEvent) => {
		onItemSelect?.(itemId);
	};
}

function handleTabContextMenu(itemId: string, event: MouseEvent) {
	event.preventDefault();
	contextMenuItemId = itemId;
	contextMenuPosition = {
		x: event.clientX,
		y: event.clientY,
	};
}

function handleContextMenuClose() {
	contextMenuPosition = null;
	contextMenuItemId = null;
}

function handleContextMenuRename() {
	if (contextMenuItemId) {
		onItemRename?.(container.id, contextMenuItemId);
	}
	handleContextMenuClose();
}

function handleContextMenuCloseItem() {
	if (contextMenuItemId) {
		onItemClose?.(container.id, contextMenuItemId);
	}
	handleContextMenuClose();
}

function handleContextMenuChangeUrl() {
	if (contextMenuItemId) {
		onItemChangeUrl?.(container.id, contextMenuItemId);
	}
	handleContextMenuClose();
}

function handleAddButtonClick(event: MouseEvent) {
	const button = event.currentTarget as HTMLButtonElement;
	const rect = button.getBoundingClientRect();
	addMenuPosition = {
		x: rect.right,
		y: rect.bottom + 2,
	};
}

function handleAddMenuClose() {
	addMenuPosition = null;
}

function handleAddItem(itemType: AddItemType) {
	onAddItem?.(container.id, itemType);
	handleAddMenuClose();
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

	const filePath = event.dataTransfer?.getData(FILETREE_FILE_DRAG_MIME);
	if (filePath) {
		onFileDrop?.(filePath, container.id, "center");
		return;
	}

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

	const filePath = event.dataTransfer?.getData(FILETREE_FILE_DRAG_MIME);
	if (filePath) {
		onFileDrop?.(filePath, container.id, "center");
		return;
	}

	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	if (droppedItemId) {
		onItemDrop?.(droppedItemId, container.id);
	}
}

function handleContentDragEnter(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer && dragHasDroppableData(event.dataTransfer)) {
		isDragOverContent = true;
	}
}

function handleContentDragOver(event: DragEvent) {
	event.preventDefault();
	if (!isDragOverContent && event.dataTransfer && dragHasDroppableData(event.dataTransfer)) {
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

	const filePath = event.dataTransfer?.getData(FILETREE_FILE_DRAG_MIME);
	if (filePath) {
		onFileDrop?.(filePath, containerId, zone);
		return;
	}

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
	<div class="relative flex h-5 items-center border-b border-border-default bg-bg-surface">
		{#if canScrollLeft}
			<div
				class="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-0.5 bg-terminal-amber transition-opacity"
			></div>
		{/if}

		<div
			bind:this={tabListEl}
			class="flex flex-1 items-center gap-0.5 overflow-x-auto px-1 scrollbar-none"
			role="tablist"
			tabindex="-1"
			onscroll={updateScrollState}
			ondragover={handleContainerDragOver}
			ondrop={handleContainerDrop}
		>
			{#each container.childIds as childId (childId)}
				{@const item = items[childId]}
				{@const terminalInstance = item?.type === "terminal" ? terminalInstanceGet(childId as TerminalId) : undefined}
				{@const needsAttention = terminalInstance ? terminalInstance.needsAttention : false}
				{@const showNotification = needsAttention && activeItemId !== childId}
				{#if item}
					<button
						type="button"
						role="tab"
						aria-selected={activeTabId === childId}
						class="shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] transition-all duration-300 cursor-grab
							{activeTabId === childId
								? 'bg-bg-elevated text-text-primary'
								: 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/50'}
							{dragOverTabId === childId ? 'ring-1 ring-terminal-green ring-inset' : ''}
							{showNotification ? 'ring-1 ring-terminal-green/30 ring-inset' : ''}"
						draggable="true"
						onclick={() => handleTabClick(childId)}
						oncontextmenu={(e) => handleTabContextMenu(childId, e)}
						ondragstart={(e) => handleTabDragStart(childId, e)}
						ondragover={(e) => handleTabDragOver(childId, e)}
						ondragleave={(e) => handleTabDragLeave(childId, e)}
						ondrop={(e) => handleTabDrop(childId, e)}
					>
						{item.label ?? item.type}
						{#if terminalInstance}
							<span
								class="inline-block size-1 rounded-full bg-terminal-green shadow-[0_0_4px_var(--color-terminal-green)] transition-opacity duration-300
									{showNotification ? 'opacity-100' : 'opacity-0'}"
							></span>
						{/if}
					</button>
				{/if}
			{/each}
		</div>

		{#if canScrollRight}
			<div
				class="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-terminal-amber transition-opacity"
				class:right-5={onAddItem}
				class:right-0={!onAddItem}
			></div>
		{/if}

		{#if onAddItem}
			<button
				type="button"
				class="shrink-0 flex size-5 items-center justify-center text-[10px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated/50 transition-colors duration-100"
				onclick={handleAddButtonClick}
				title="Add item"
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
			{@const isActiveTab = activeTabId === childId}
			{#if item}
				<div
					class="absolute inset-0"
					class:hidden={!isActiveTab}
					aria-hidden={!isActiveTab}
				>
					<LayoutItem_
						{item}
						{projectPath}
						isActive={activeItemId === childId}
						draggable={true}
						isDropTarget={true}
						onclick={handleItemClick(childId)}
						onDragStart={handleTabDragStart}
						onDrop={(droppedId, _targetId, e) => handleTabDrop(childId, e)}
					/>
				</div>
			{/if}
		{/each}

		<LayoutDropZone
			containerId={container.id}
			isVisible={isDragOverContent}
			onDrop={handleDropZoneDrop}
		/>
	</div>
</div>

{#if contextMenuPosition && contextMenuItemId}
	<LayoutContainerTabsContextMenu
		position={contextMenuPosition}
		itemType={items[contextMenuItemId]?.type}
		onRename={handleContextMenuRename}
		onChangeUrl={handleContextMenuChangeUrl}
		onClose={handleContextMenuCloseItem}
		onMenuClose={handleContextMenuClose}
	/>
{/if}

{#if addMenuPosition}
	<LayoutContainerTabsAddMenu
		position={addMenuPosition}
		onAddItem={handleAddItem}
		onMenuClose={handleAddMenuClose}
	/>
{/if}
