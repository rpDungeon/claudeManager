<!--
@component
name: Terminal
type: smart
styleguide: 1.0.0
description: Complete terminal pane combining header and body with CRT aesthetic
usage: Display a full terminal with header info and xterm.js content area
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { Terminal as XTerm } from "@xterm/xterm";
import TerminalHeader from "./header/TerminalHeader.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import TerminalBody from "./body/TerminalBody.component.svelte";

interface Props {
	title?: string | Snippet;
	info?: string | Snippet;
	isActive?: boolean;
	statusColor?: IndicatorDotColor;
	onclick?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onMount?: (container: HTMLDivElement) => void;
	onTerminalReady?: (terminal: XTerm) => void;
}

let {
	title = "shell",
	info,
	isActive = false,
	statusColor = IndicatorDotColor.Green,
	onclick,
	onHeaderClick,
	onBodyClick,
	onMount,
	onTerminalReady,
}: Props = $props();

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
}
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
		{onMount}
		{onTerminalReady}
	/>
</div>
