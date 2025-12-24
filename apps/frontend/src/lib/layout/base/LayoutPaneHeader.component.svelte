<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutPaneHeader
type: stupid
styleguide: 1.0.0
description: Draggable header bar for layout panes with native HTML5 drag and drop
usage: Use as the header for any layout pane that needs drag/drop reordering
-->
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	label?: string | Snippet;
	itemId: string;
	draggable?: boolean;
	isActive?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
	onDragOver?: (itemId: string, event: DragEvent) => void;
	onDragLeave?: (itemId: string, event: DragEvent) => void;
	trailing?: Snippet;
}

let {
	label = "Untitled",
	itemId,
	draggable = true,
	isActive = false,
	isDropTarget = false,
	onclick,
	onDragStart,
	onDragEnd,
	onDrop,
	onDragOver,
	onDragLeave,
	trailing,
}: Props = $props();

let isDragging = $state(false);
let isDraggedOver = $state(false);

const labelIsSnippet = $derived(typeof label === "function");

function handleDragStart(event: DragEvent) {
	if (!draggable) return;

	isDragging = true;
	event.dataTransfer?.setData("text/plain", itemId);
	event.dataTransfer?.setData("application/x-layout-item", itemId);

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
	}

	onDragStart?.(itemId, event);
}

function handleDragEnd(event: DragEvent) {
	isDragging = false;
	onDragEnd?.(itemId, event);
}

function handleDragOver(event: DragEvent) {
	if (!isDropTarget) return;

	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	isDraggedOver = true;
	onDragOver?.(itemId, event);
}

function handleDragLeave(event: DragEvent) {
	isDraggedOver = false;
	onDragLeave?.(itemId, event);
}

function handleDrop(event: DragEvent) {
	if (!isDropTarget) return;

	event.preventDefault();
	isDraggedOver = false;

	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	if (droppedItemId && droppedItemId !== itemId) {
		onDrop?.(droppedItemId, itemId, event);
	}
}
</script>

<button
	type="button"
	class="flex h-5 w-full items-center gap-1.5 border-b border-border-default bg-bg-surface px-2 text-[10px] transition-colors duration-100 hover:bg-bg-elevated"
	class:bg-bg-elevated={isActive}
	class:opacity-50={isDragging}
	class:ring-1={isDraggedOver}
	class:ring-terminal-green={isDraggedOver}
	class:ring-inset={isDraggedOver}
	class:cursor-grab={draggable && !isDragging}
	class:cursor-grabbing={isDragging}
	{onclick}
	draggable={draggable ? "true" : "false"}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<span class="truncate text-text-tertiary" class:text-text-primary={isActive}>
		{#if labelIsSnippet}
			{@render (label as Snippet)()}
		{:else}
			{label}
		{/if}
	</span>

	{#if trailing}
		<span class="ml-auto">
			{@render trailing()}
		</span>
	{/if}
</button>
