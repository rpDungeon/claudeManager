<!--
@component
name: TerminalBody
type: smart
styleguide: 1.0.0
description: Terminal body container with CRT scanline effect and xterm.js mount point
usage: Display terminal content with visual feedback for active/inactive state
-->
<script lang="ts">
import { untrack } from "svelte";

interface Props {
	isActive?: boolean;
	onclick?: (event: MouseEvent) => void;
	oncontextmenu?: (event: MouseEvent) => void;
	onMount?: (container: HTMLDivElement) => void;
}

let { isActive = false, onclick, oncontextmenu, onMount: onMountCallback }: Props = $props();

function handleContextMenu(event: MouseEvent) {
	event.preventDefault();
	oncontextmenu?.(event);
}

let containerRef: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerRef) {
		untrack(() => onMountCallback?.(containerRef));
	}
});
</script>

<div
	class="terminal-body relative flex flex-1 cursor-pointer flex-col overflow-hidden bg-bg-void transition-shadow duration-[120ms] ease-out"
	class:ring-2={isActive}
	class:ring-inset={isActive}
	class:ring-terminal-green={isActive}
	class:hover:ring-1={!isActive}
	class:hover:ring-inset={!isActive}
	class:hover:ring-border-active={!isActive}
	role="button"
	tabindex="0"
	onclick={(e) => onclick?.(e)}
	oncontextmenu={handleContextMenu}
	onkeydown={(e) => e.key === "Enter" && onclick?.(new MouseEvent("click"))}
>
	<div class="scanlines pointer-events-none absolute inset-0 z-10 opacity-50"></div>

	<div bind:this={containerRef} class="xterm-container relative z-0 flex-1 overflow-hidden p-3">
	</div>
</div>

<style>
	.scanlines {
		background: repeating-linear-gradient(
			0deg,
			rgba(0, 255, 65, 0.03) 0px,
			transparent 1px,
			transparent 2px,
			rgba(0, 255, 65, 0.03) 3px
		);
	}

	.xterm-container :global(.xterm) {
		height: 100%;
		position: relative;
	}

	.xterm-container :global(.xterm-viewport) {
		position: absolute !important;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow-y: auto;
	}

	.xterm-container :global(.xterm-screen) {
		position: absolute !important;
		top: 0;
		left: 0;
	}

	.xterm-container :global(.xterm-helpers) {
		position: absolute !important;
		top: 0;
		left: 0;
		z-index: -5;
	}

	/* CRT-themed scrollbar */
	.xterm-container :global(.xterm-viewport) {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 255, 65, 0.5) rgba(0, 0, 0, 0.3);
	}

	.xterm-container :global(.xterm-viewport::-webkit-scrollbar) {
		width: 8px;
	}

	.xterm-container :global(.xterm-viewport::-webkit-scrollbar-track) {
		background: rgba(0, 0, 0, 0.3);
		border-left: 1px solid rgba(0, 255, 65, 0.1);
	}

	.xterm-container :global(.xterm-viewport::-webkit-scrollbar-thumb) {
		background: linear-gradient(
			180deg,
			rgba(0, 255, 65, 0.6) 0%,
			rgba(0, 255, 65, 0.4) 50%,
			rgba(0, 255, 65, 0.6) 100%
		);
		border-radius: 4px;
		box-shadow:
			0 0 4px rgba(0, 255, 65, 0.4),
			inset 0 0 2px rgba(0, 255, 65, 0.2);
	}

	.xterm-container :global(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(
			180deg,
			rgba(0, 255, 65, 0.8) 0%,
			rgba(0, 255, 65, 0.6) 50%,
			rgba(0, 255, 65, 0.8) 100%
		);
		box-shadow:
			0 0 8px rgba(0, 255, 65, 0.6),
			inset 0 0 4px rgba(0, 255, 65, 0.3);
	}

	.xterm-container :global(.xterm-viewport::-webkit-scrollbar-thumb:active) {
		background: rgba(0, 255, 65, 0.9);
		box-shadow: 0 0 12px rgba(0, 255, 65, 0.8);
	}

	.xterm-container :global(.xterm-selection div) {
		background-color: rgba(0, 255, 65, 0.2) !important;
	}
</style>
