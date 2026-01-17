<!-- Review pending by Autumnlight -->
<!--
@component
name: TerminalHeader
type: stupid
styleguide: 1.0.0
description: Draggable terminal pane header with status indicator, title, and info
usage: Display command name and status at the top of a terminal pane
-->
<script lang="ts">
import type { Snippet } from "svelte";
import IndicatorDot from "$lib/common/IndicatorDot.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

interface Props {
	title?: string | Snippet;
	info?: string | Snippet;
	itemId?: string;
	isActive?: boolean;
	statusColor?: IndicatorDotColor;
	draggable?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onStatusClick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	title = "shell",
	info,
	itemId,
	isActive = false,
	statusColor = IndicatorDotColor.Green,
	draggable = false,
	isDropTarget = false,
	onclick,
	onStatusClick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

function handleStatusClick(event: MouseEvent) {
	if (onStatusClick) {
		event.stopPropagation();
		onStatusClick(event);
	}
}

let isDragging = $state(false);
let isDraggedOver = $state(false);

const titleIsSnippet = $derived(typeof title === "function");
const infoIsSnippet = $derived(typeof info === "function");

function handleDragStart(event: DragEvent) {
	if (!(draggable && itemId)) return;

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
	if (itemId) {
		onDragEnd?.(itemId, event);
	}
}

function handleDragOver(event: DragEvent) {
	if (!isDropTarget) return;

	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	isDraggedOver = true;
}

function handleDragLeave(_event: DragEvent) {
	isDraggedOver = false;
}

function handleDrop(event: DragEvent) {
	if (!(isDropTarget && itemId)) return;

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
	class="flex h-5 w-full items-center gap-1.5 border-b border-border-default bg-bg-surface px-2 text-[10px] hover:bg-bg-elevated transition-colors duration-100"
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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span
		class="flex items-center justify-center p-1 -m-1 rounded transition-colors order-last md:order-first"
		class:hover:bg-bg-elevated={onStatusClick}
		class:cursor-pointer={onStatusClick}
		onclick={handleStatusClick}
		title={onStatusClick ? "Click to reconnect" : undefined}
	>
		<IndicatorDot color={statusColor} glow pulse={isActive} />
	</span>
	<span class="font-normal text-text-tertiary">
		{#if titleIsSnippet}
			{@render (title as Snippet)()}
		{:else}
			{title}
		{/if}
	</span>
	{#if info}
		<span class="ml-auto text-[9px] text-text-tertiary">
			{#if infoIsSnippet}
				{@render (info as Snippet)()}
			{:else}
				{info}
			{/if}
		</span>
	{/if}
</button>
