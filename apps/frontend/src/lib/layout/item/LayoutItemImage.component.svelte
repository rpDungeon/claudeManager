<!--
@component
name: LayoutItemImage
type: stupid
styleguide: 1.0.0
description: Renders an image item within the layout system
usage: Pass image item data to render an image with optional alt text
-->
<script lang="ts">
import type { LayoutItemImage } from "@claude-manager/common/src/layout/item/item.image";
import LayoutPane from "../base/LayoutPane.component.svelte";

interface Props {
	item: LayoutItemImage;
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
	label={item.label ?? "image"}
	{isActive}
	{draggable}
	{isDropTarget}
	onHeaderClick={onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
>
	<div class="h-full w-full overflow-auto bg-bg-void flex items-center justify-center p-2">
		<img
			src={item.src}
			alt={item.alt ?? item.label ?? "Image"}
			class="max-h-full max-w-full object-contain"
		/>
	</div>
</LayoutPane>
