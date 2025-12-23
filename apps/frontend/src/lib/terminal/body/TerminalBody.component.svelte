<!--
@component
name: TerminalBody
type: smart
styleguide: 1.0.0
description: Terminal body container with CRT scanline effect and xterm.js mount point
usage: Display terminal content with visual feedback for active/inactive state
-->
<script lang="ts">
interface Props {
	isActive?: boolean;
	onclick?: (event: MouseEvent) => void;
	onMount?: (container: HTMLDivElement) => void;
}

let { isActive = false, onclick, onMount: onMountCallback }: Props = $props();

let containerRef: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerRef && onMountCallback) {
		onMountCallback(containerRef);
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
	}

	.xterm-container :global(.xterm-viewport) {
		overflow-y: auto;
	}

	.xterm-container :global(.xterm-screen) {
		height: 100%;
	}
</style>
