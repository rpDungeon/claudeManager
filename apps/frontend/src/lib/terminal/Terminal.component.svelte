<!--
@component
name: Terminal
type: smart
styleguide: 1.0.0
description: Complete terminal pane combining header and body with CRT aesthetic
usage: Pass terminalId to connect to PTY backend, or use without for display-only mode
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { onMount, onDestroy } from "svelte";
import TerminalHeader from "./header/TerminalHeader.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import TerminalBody from "./body/TerminalBody.component.svelte";
import { terminalService, type TerminalInstance } from "./terminal.service";
import { TerminalConnectionStatus } from "./terminal.lib";

interface Props {
	terminalId?: string;
	title?: string | Snippet;
	info?: string | Snippet;
	isActive?: boolean;
	autoConnect?: boolean;
	onclick?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onConnectionStatusChange?: (status: TerminalConnectionStatus) => void;
	onExit?: (code: number) => void;
	onError?: (message: string) => void;
}

let {
	terminalId,
	title = "shell",
	info,
	isActive = false,
	autoConnect = true,
	onclick,
	onHeaderClick,
	onBodyClick,
	onConnectionStatusChange,
	onExit,
	onError,
}: Props = $props();

let instance: TerminalInstance | undefined = $state();
let connectionStatus = $state<TerminalConnectionStatus>(TerminalConnectionStatus.Disconnected);
let resizeObserver: ResizeObserver | undefined;

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
	if (terminalId && instance) {
		terminalService.instanceMount(terminalId, container);

		resizeObserver = new ResizeObserver(() => {
			if (terminalId) {
				terminalService.instanceFit(terminalId);
			}
		});
		resizeObserver.observe(container);

		if (autoConnect) {
			terminalService.websocketConnect(terminalId);
		}
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
	instance?.terminal.focus();
}

onMount(() => {
	if (!terminalId) return;

	instance = terminalService.instanceCreate(terminalId, {
		onConnectionStatusChange: (status) => {
			connectionStatus = status;
			onConnectionStatusChange?.(status);
		},
		onError: (message) => {
			onError?.(message);
		},
		onExit: (code) => {
			onExit?.(code);
		},
	});
});

onDestroy(() => {
	resizeObserver?.disconnect();
});
</script>

<div class="flex h-full flex-col">
	<TerminalHeader
		{title}
		{info}
		{isActive}
		{statusColor}
		onclick={handleHeaderClick}
	/>
	<TerminalBody
		{isActive}
		onclick={handleBodyClick}
		onMount={handleBodyMount}
	/>
</div>
