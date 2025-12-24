<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutItemIframe
type: stupid
styleguide: 1.0.0
description: Renders an iframe item within the layout system
usage: Pass iframe item data to render an embedded webpage
-->
<script lang="ts">
import type { LayoutItemIframe } from "@claude-manager/common/src/layout/item/item.iframe";
import LayoutPane from "../base/LayoutPane.component.svelte";

interface Props {
	item: LayoutItemIframe;
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
	label={item.label ?? "iframe"}
	{isActive}
	{draggable}
	{isDropTarget}
	onHeaderClick={onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
>
	{#snippet headerTrailing()}
		<span class="text-[9px] text-text-tertiary truncate max-w-32">{item.url}</span>
	{/snippet}

	<iframe
		src={item.url}
		title={item.label ?? "Embedded content"}
		class="h-full w-full border-0"
		sandbox="allow-scripts allow-same-origin"
	></iframe>
</LayoutPane>
