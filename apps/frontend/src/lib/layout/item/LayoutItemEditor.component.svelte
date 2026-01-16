<!--
@component
name: LayoutItemEditor
type: stupid
styleguide: 1.0.0
description: Renders an editor item within the layout system
usage: Pass editor item data to render the Editor component
-->
<script lang="ts">
import type { LayoutItemEditor } from "@claude-manager/common/src/layout/item/item.editor";
import Editor from "$lib/editor/Editor.component.svelte";

interface Props {
	item: LayoutItemEditor;
	projectPath?: string;
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
	projectPath,
	isActive = false,
	draggable = true,
	isDropTarget = false,
	onclick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();
</script>

<Editor
	editorId={item.id}
	filePath={item.filePath}
	{projectPath}
	enableLsp={!!projectPath}
	itemId={item.id}
	{isActive}
	{draggable}
	{isDropTarget}
	{onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
/>
