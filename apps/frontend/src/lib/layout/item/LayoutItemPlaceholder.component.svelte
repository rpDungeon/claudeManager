<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutItemPlaceholder
type: stupid
styleguide: 1.0.0
description: Placeholder for unimplemented item types (image, markdown)
usage: Shows a placeholder with item type and label
-->
<script lang="ts">
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import LayoutPane from "../base/LayoutPane.component.svelte";

interface Props {
	item: LayoutItem;
	isActive?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	item,
	isActive = false,
	draggable = true,
	isDropTarget = false,
	onclick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();
</script>

<LayoutPane
	itemId={item.id}
	label={item.label ?? "Untitled"}
	{isActive}
	{draggable}
	{isDropTarget}
	onHeaderClick={onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
>
	{#snippet headerTrailing()}
		<span class="text-[9px] uppercase tracking-wider text-text-tertiary opacity-50">{item.type}</span>
	{/snippet}

	<div class="flex h-full w-full items-center justify-center text-text-tertiary">
		<span class="text-xs opacity-50">({item.type} not implemented)</span>
	</div>
</LayoutPane>
