<!--
@component
name: LayoutItemMarkdown
type: stupid
styleguide: 1.0.0
description: Renders markdown content within the layout system
usage: Pass markdown item data to render formatted markdown content
-->
<script lang="ts">
import type { LayoutItemMarkdown } from "@claude-manager/common/src/layout/item/item.markdown";
import { marked } from "marked";
import LayoutPane from "../base/LayoutPane.component.svelte";

interface Props {
	item: LayoutItemMarkdown;
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

const renderedContent = $derived(
	marked.parse(item.content, {
		async: false,
	}) as string,
);
</script>

<LayoutPane
	itemId={item.id}
	label={item.label ?? "markdown"}
	{isActive}
	{draggable}
	{isDropTarget}
	onHeaderClick={onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
>
	<div class="h-full w-full overflow-auto bg-bg-surface p-4">
		<article class="prose prose-invert prose-sm max-w-none">
			{@html renderedContent}
		</article>
	</div>
</LayoutPane>
