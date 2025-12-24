<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutDropZone
type: stupid
styleguide: 1.0.0
description: VS Code-style drop zone overlay with edge/center detection
usage: Overlay on containers during drag to show split indicators
-->
<script lang="ts">
import type { LayoutDropZonePosition } from "./dropzone.lib";
import { layoutDropZonePositionFromCoordinates } from "./dropzone.lib";

interface Props {
	containerId: string;
	isVisible: boolean;
	onZoneChange?: (zone: LayoutDropZonePosition | null) => void;
	onDrop?: (containerId: string, zone: LayoutDropZonePosition, event: DragEvent) => void;
}

let { containerId, isVisible, onZoneChange, onDrop }: Props = $props();

let containerEl = $state<HTMLDivElement | null>(null);
let activeZone = $state<LayoutDropZonePosition | null>(null);

function handleDragOver(event: DragEvent) {
	event.preventDefault();
	if (!(containerEl && event.dataTransfer)) return;

	event.dataTransfer.dropEffect = "move";

	const rect = containerEl.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	const newZone = layoutDropZonePositionFromCoordinates(x, y, rect.width, rect.height);

	if (newZone !== activeZone) {
		activeZone = newZone;
		onZoneChange?.(newZone);
	}
}

function handleDragLeave(event: DragEvent) {
	const relatedTarget = event.relatedTarget as Node | null;
	if (containerEl && relatedTarget && containerEl.contains(relatedTarget)) {
		return;
	}
	activeZone = null;
	onZoneChange?.(null);
}

function handleDrop(event: DragEvent) {
	event.preventDefault();
	event.stopPropagation();
	if (activeZone) {
		onDrop?.(containerId, activeZone, event);
	}
	activeZone = null;
	onZoneChange?.(null);
}
</script>

{#if isVisible}
	<div
		bind:this={containerEl}
		class="absolute inset-0 z-50"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
		aria-label="Drop zone"
	>
		<div
			class="absolute inset-y-0 left-0 w-[30%] transition-all duration-150
				{activeZone === 'left' ? 'bg-terminal-green/20 border-l-2 border-terminal-green' : ''}"
		></div>

		<div
			class="absolute inset-y-0 right-0 w-[30%] transition-all duration-150
				{activeZone === 'right' ? 'bg-terminal-green/20 border-r-2 border-terminal-green' : ''}"
		></div>

		<div
			class="absolute inset-x-0 top-0 h-[30%] transition-all duration-150
				{activeZone === 'top' ? 'bg-terminal-green/20 border-t-2 border-terminal-green' : ''}"
		></div>

		<div
			class="absolute inset-x-0 bottom-0 h-[30%] transition-all duration-150
				{activeZone === 'bottom' ? 'bg-terminal-green/20 border-b-2 border-terminal-green' : ''}"
		></div>

		<div
			class="absolute left-[30%] right-[30%] top-[30%] bottom-[30%] transition-all duration-150
				{activeZone === 'center' ? 'bg-terminal-cyan/20 border-2 border-terminal-cyan border-dashed' : ''}"
		></div>

		{#if activeZone}
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div class="bg-bg-elevated/90 px-3 py-1.5 rounded text-[11px] text-text-primary border border-border-active">
					{#if activeZone === "center"}
						Add to tabs
					{:else if activeZone === "left"}
						Split left
					{:else if activeZone === "right"}
						Split right
					{:else if activeZone === "top"}
						Split top
					{:else if activeZone === "bottom"}
						Split bottom
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
