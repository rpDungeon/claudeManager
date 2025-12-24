<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutPane
type: stupid
styleguide: 1.0.0
description: Generic layout pane wrapper with draggable header and body slot
usage: Wrap any content in a consistent pane structure with optional header
-->
<script lang="ts">
import type { Snippet } from "svelte";
import LayoutPaneHeader from "./LayoutPaneHeader.component.svelte";

interface Props {
	itemId: string;
	label?: string | Snippet;
	isActive?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	showHeader?: boolean;
	children: Snippet;
	headerTrailing?: Snippet;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
	onDragOver?: (itemId: string, event: DragEvent) => void;
	onDragLeave?: (itemId: string, event: DragEvent) => void;
}

let {
	itemId,
	label = "Untitled",
	isActive = false,
	draggable = true,
	isDropTarget = false,
	showHeader = true,
	children,
	headerTrailing,
	onHeaderClick,
	onBodyClick,
	onDragStart,
	onDragEnd,
	onDrop,
	onDragOver,
	onDragLeave,
}: Props = $props();
</script>

<div
	class="flex h-full w-full flex-col overflow-hidden bg-bg-void"
	class:ring-2={isActive}
	class:ring-inset={isActive}
	class:ring-terminal-green={isActive}
>
	{#if showHeader}
		<LayoutPaneHeader
			{itemId}
			{label}
			{isActive}
			{draggable}
			{isDropTarget}
			onclick={onHeaderClick}
			{onDragStart}
			{onDragEnd}
			{onDrop}
			{onDragOver}
			{onDragLeave}
			trailing={headerTrailing}
		/>
	{/if}

	<div
		class="flex-1 overflow-hidden"
		role="button"
		tabindex="-1"
		onclick={(e) => onBodyClick?.(e)}
		onkeydown={(e) => e.key === "Enter" && onBodyClick?.(new MouseEvent("click"))}
	>
		{@render children()}
	</div>
</div>
