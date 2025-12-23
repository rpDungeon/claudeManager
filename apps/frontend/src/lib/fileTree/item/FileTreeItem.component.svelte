<!--
@component
name: FileTreeItem
type: stupid
styleguide: 1.0.0
description: Single file tree row renderer with icon, name, meta, and status indicator
usage: Used by FileTreeNode to render individual items in a tree structure
-->
<script lang="ts">
import { ChevronDown, Loader2 } from "lucide-svelte";
import IndicatorDot from "$lib/common/IndicatorDot.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import { FileTreeItemType, fileStatusColorMap, type FileStatus } from "../fileTree.lib";

interface Props {
	name: string;
	type: FileTreeItemType;
	status?: FileStatus;
	meta?: string;
	depth?: number;
	isExpanded?: boolean;
	isSelected?: boolean;
	isLoading?: boolean;
	isActive?: boolean;
	hasChildren?: boolean;
	draggable?: boolean;
	onclick?: () => void;
	onToggle?: () => void;
	ondragstart?: (event: DragEvent) => void;
	ondragover?: (event: DragEvent) => void;
	ondragleave?: (event: DragEvent) => void;
	ondrop?: (event: DragEvent) => void;
}

let {
	name,
	type,
	status,
	meta,
	depth = 0,
	isExpanded = false,
	isSelected = false,
	isLoading = false,
	isActive = false,
	hasChildren = false,
	draggable = false,
	onclick,
	onToggle,
	ondragstart,
	ondragover,
	ondragleave,
	ondrop,
}: Props = $props();

let isDragOver = $state(false);

const isFolder = $derived(type === FileTreeItemType.Folder);
const showChevron = $derived(isFolder && (hasChildren || isLoading));
const statusColor = $derived(status ? fileStatusColorMap[status] : IndicatorDotColor.Gray);

function handleClick() {
	onclick?.();
}

function handleToggleClick(event: Event) {
	event.stopPropagation();
	onToggle?.();
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onclick?.();
	}
	if (event.key === "ArrowRight" && isFolder && !isExpanded) {
		event.preventDefault();
		onToggle?.();
	}
	if (event.key === "ArrowLeft" && isFolder && isExpanded) {
		event.preventDefault();
		onToggle?.();
	}
}

function handleDragStart(event: DragEvent) {
	ondragstart?.(event);
}

function handleDragOver(event: DragEvent) {
	if (!isFolder) return;
	event.preventDefault();
	isDragOver = true;
	ondragover?.(event);
}

function handleDragLeave(event: DragEvent) {
	isDragOver = false;
	ondragleave?.(event);
}

function handleDrop(event: DragEvent) {
	event.preventDefault();
	isDragOver = false;
	ondrop?.(event);
}
</script>

<button
	type="button"
	class="flex w-full items-center gap-1 rounded-[3px] px-1 py-[3px] text-[11px] transition-colors duration-100 hover:bg-bg-elevated {isDragOver ? 'bg-terminal-cyan/20 ring-1 ring-terminal-cyan/50' : ''}"
	class:bg-bg-elevated={isSelected}
	{draggable}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	ondragstart={handleDragStart}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	style:padding-left="{depth * 12 + 4}px"
>
	<span
		class="flex size-3 shrink-0 items-center justify-center text-text-tertiary transition-transform duration-150"
		class:-rotate-90={!isExpanded}
		class:invisible={!showChevron}
		onclick={handleToggleClick}
		onkeydown={(e) => e.key === "Enter" && handleToggleClick(e)}
		role="button"
		tabindex="-1"
	>
		{#if isLoading}
			<Loader2 class="size-3 animate-spin" />
		{:else}
			<ChevronDown class="size-3" />
		{/if}
	</span>

	<span class="flex size-[13px] shrink-0 items-center justify-center text-[11px] text-text-secondary">
		{#if isFolder}
			<span class:text-amber-500={isExpanded}>📁</span>
		{:else}
			<span>📄</span>
		{/if}
	</span>

	<span class="min-w-0 flex-1 truncate text-left font-medium text-text-primary">
		{name}
	</span>

	{#if meta}
		<span class="shrink-0 font-mono text-[9px] text-text-tertiary">
			{meta}
		</span>
	{/if}

	<IndicatorDot color={statusColor} glow={isActive} pulse={isActive} />
</button>
