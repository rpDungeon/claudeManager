<!-- Review pending by Autumnlight -->
<!--
@component
name: Terminal
type: smart
styleguide: 1.0.0
description: Complete terminal pane combining header and body with CRT aesthetic
usage: Pass terminalId to connect to PTY backend, or use without for display-only mode
-->
<script lang="ts">
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import type { Snippet } from "svelte";
import { onMount, onDestroy } from "svelte";
import TerminalBody from "./body/TerminalBody.component.svelte";
import TerminalHeader from "./header/TerminalHeader.component.svelte";
import {
	terminalInstanceCreate,
	terminalInstanceDestroy,
	terminalInstanceFit,
	terminalInstanceFocus,
	terminalInstanceGet,
	terminalInstanceMount,
	terminalWebsocketConnect,
} from "./terminal.service.svelte";
import { TerminalConnectionStatus } from "./terminal.lib";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

interface Props {
	terminalId?: TerminalId;
	title?: string | Snippet;
	info?: string | Snippet;
	itemId?: string;
	isActive?: boolean;
	autoConnect?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	terminalId,
	title = "shell",
	info,
	itemId,
	isActive = false,
	autoConnect = true,
	draggable = false,
	isDropTarget = false,
	onclick,
	onHeaderClick,
	onBodyClick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

let resizeObserver: ResizeObserver | undefined;

const instance = $derived(terminalId ? terminalInstanceGet(terminalId) : undefined);
const connectionStatus = $derived(instance?.connectionStatus ?? TerminalConnectionStatus.Disconnected);

const statusColor = $derived.by(() => {
	switch (connectionStatus) {
		case TerminalConnectionStatus.Connected:
			return IndicatorDotColor.Green;
		case TerminalConnectionStatus.Connecting:
			return IndicatorDotColor.Amber;
		case TerminalConnectionStatus.Error:
			return IndicatorDotColor.Red;
		default:
			return IndicatorDotColor.Gray;
	}
});

function handleBodyMount(container: HTMLDivElement) {
	if (!terminalId) return;

	terminalInstanceMount(terminalId, container);

	resizeObserver = new ResizeObserver(() => {
		if (terminalId) {
			terminalInstanceFit(terminalId);
		}
	});
	resizeObserver.observe(container);

	if (autoConnect) {
		terminalWebsocketConnect(terminalId);
	}
}

function handleClick(event: MouseEvent) {
	onclick?.(event);
}

function handleHeaderClick(event: MouseEvent) {
	handleClick(event);
	onHeaderClick?.(event);
}

function handleBodyClick(event: MouseEvent) {
	handleClick(event);
	onBodyClick?.(event);
	if (terminalId) {
		terminalInstanceFocus(terminalId);
	}
}

onMount(() => {
	if (!terminalId) return;
	terminalInstanceCreate(terminalId);
});

onDestroy(() => {
	resizeObserver?.disconnect();
	if (terminalId) {
		terminalInstanceDestroy(terminalId);
	}
});
</script>

<div class="flex h-full flex-col">
	<TerminalHeader
		{title}
		{info}
		{itemId}
		{isActive}
		{statusColor}
		{draggable}
		{isDropTarget}
		onclick={handleHeaderClick}
		{onDragStart}
		{onDragEnd}
		{onDrop}
	/>
	<TerminalBody
		{isActive}
		onclick={handleBodyClick}
		onMount={handleBodyMount}
	/>
</div>
