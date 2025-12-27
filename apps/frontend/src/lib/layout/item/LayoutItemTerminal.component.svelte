<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutItemTerminal
type: stupid
styleguide: 1.0.0
description: Renders a terminal item within the layout system
usage: Pass terminal item data to render the Terminal component
-->
<script lang="ts">
import type { LayoutItemTerminal } from "@claude-manager/common/src/layout/item/item.terminal";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import Terminal from "$lib/terminal/Terminal.component.svelte";

interface Props {
	item: LayoutItemTerminal;
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

<Terminal
	terminalId={item.id as TerminalId}
	title={item.label ?? "shell"}
	{isActive}
	{onclick}
	itemId={item.id}
	{draggable}
	{isDropTarget}
	{onDragStart}
	{onDragEnd}
	{onDrop}
/>
