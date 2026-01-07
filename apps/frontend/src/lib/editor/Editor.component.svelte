<!--
@component
name: Editor
type: smart
styleguide: 1.0.0
description: Code editor pane with CodeMirror 6 and CRT aesthetic
usage: Pass filePath to load and edit a file from the project directory
-->
<script lang="ts">
import { onDestroy } from "svelte";
import IndicatorDot from "$lib/common/IndicatorDot.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import Breadcrumbs from "$lib/breadcrumbs/Breadcrumbs.component.svelte";
import {
	editorInstanceCreate,
	editorInstanceDestroy,
	editorInstanceGet,
	editorInstanceMount,
	editorInstanceFocus,
	editorFileLoad,
	editorFileSave,
	editorLspConnect,
} from "./editor.service.svelte";
import { EditorConnectionStatus, editorLanguageIdFromPath } from "./editor.lib";

interface Props {
	editorId: string;
	filePath: string;
	projectPath?: string;
	itemId?: string;
	isActive?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	enableLsp?: boolean;
	onclick?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	editorId,
	filePath,
	projectPath,
	itemId,
	isActive = false,
	draggable = false,
	isDropTarget = false,
	enableLsp = false,
	onclick,
	onHeaderClick,
	onBodyClick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

let containerRef: HTMLDivElement | undefined = $state();
let isDragging = $state(false);
let isDraggedOver = $state(false);
let hasLoaded = false;

const instance = $derived(editorInstanceGet(editorId));
const connectionStatus = $derived(instance?.connectionStatus ?? EditorConnectionStatus.Disconnected);
const isDirty = $derived(instance?.isDirty ?? false);
const isLoading = $derived(instance?.isLoading ?? false);
const error = $derived(instance?.error ?? null);

const languageId = $derived(editorLanguageIdFromPath(filePath));

const statusColor = $derived.by(() => {
	if (error) return IndicatorDotColor.Red;
	if (isLoading) return IndicatorDotColor.Amber;
	if (isDirty) return IndicatorDotColor.Amber;
	switch (connectionStatus) {
		case EditorConnectionStatus.Connected:
			return IndicatorDotColor.Green;
		case EditorConnectionStatus.Connecting:
			return IndicatorDotColor.Amber;
		case EditorConnectionStatus.Error:
			return IndicatorDotColor.Red;
		default:
			return IndicatorDotColor.Gray;
	}
});

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
	editorInstanceFocus(editorId);
}

function handleDragStart(event: DragEvent) {
	if (!(draggable && itemId)) return;

	isDragging = true;
	event.dataTransfer?.setData("text/plain", itemId);
	event.dataTransfer?.setData("application/x-layout-item", itemId);

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
	}

	onDragStart?.(itemId, event);
}

function handleDragEnd(event: DragEvent) {
	isDragging = false;
	if (itemId) {
		onDragEnd?.(itemId, event);
	}
}

function handleDragOver(event: DragEvent) {
	if (!isDropTarget) return;

	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	isDraggedOver = true;
}

function handleDragLeave() {
	isDraggedOver = false;
}

function handleDrop(event: DragEvent) {
	if (!(isDropTarget && itemId)) return;

	event.preventDefault();
	isDraggedOver = false;

	const droppedItemId = event.dataTransfer?.getData("application/x-layout-item");
	if (droppedItemId && droppedItemId !== itemId) {
		onDrop?.(droppedItemId, itemId, event);
	}
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.ctrlKey && event.key === "s") {
		event.preventDefault();
		void editorFileSave(editorId);
	}
}

$effect(() => {
	if (containerRef && !hasLoaded) {
		hasLoaded = true;
		const inst = editorInstanceGet(editorId);
		if (!inst) {
			editorInstanceCreate(editorId, filePath);
		}
		editorInstanceMount(editorId, containerRef);
		void editorFileLoad(editorId).then(() => {
			if (enableLsp && projectPath) {
				const rootUri = `file://${projectPath}`;
				void editorLspConnect(editorId, rootUri);
			}
		});
	}
});

onDestroy(() => {
	editorInstanceDestroy(editorId);
});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="relative flex h-full flex-col">
	<button
		type="button"
		class="flex h-5 w-full items-center gap-1.5 border-b border-border-default bg-bg-surface px-2 text-[10px] hover:bg-bg-elevated transition-colors duration-100"
		class:opacity-50={isDragging}
		class:ring-1={isDraggedOver}
		class:ring-terminal-green={isDraggedOver}
		class:ring-inset={isDraggedOver}
		class:cursor-grab={draggable && !isDragging}
		class:cursor-grabbing={isDragging}
		onclick={handleHeaderClick}
		draggable={draggable ? "true" : "false"}
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<IndicatorDot color={statusColor} glow pulse={isActive} />
		{#if isDirty}
			<span class="text-terminal-amber">●</span>
		{/if}
		{#if projectPath}
			<Breadcrumbs {filePath} {projectPath} />
		{/if}
		<span class="ml-auto text-[9px] text-text-tertiary uppercase">{languageId}</span>
	</button>

	<div
		class="editor-body relative flex flex-1 cursor-text flex-col overflow-hidden bg-bg-void transition-shadow duration-[120ms] ease-out"
		class:ring-2={isActive}
		class:ring-inset={isActive}
		class:ring-terminal-green={isActive}
		class:hover:ring-1={!isActive}
		class:hover:ring-inset={!isActive}
		class:hover:ring-border-active={!isActive}
		role="button"
		tabindex="0"
		onclick={handleBodyClick}
		onkeydown={(e) => e.key === "Enter" && handleBodyClick(new MouseEvent("click"))}
	>
		<div bind:this={containerRef} class="editor-container relative z-0 flex-1 overflow-hidden">
		</div>
		{#if isLoading}
			<div class="absolute inset-0 flex items-center justify-center bg-bg-void text-text-tertiary text-[11px]">
				Loading...
			</div>
		{:else if error}
			<div class="absolute inset-0 flex items-center justify-center bg-bg-void text-terminal-red text-[11px]">
				{error}
			</div>
		{/if}
	</div>
</div>

<style>
	.editor-container :global(.cm-editor) {
		height: 100%;
	}

	.editor-container :global(.cm-scroller) {
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 255, 65, 0.5) rgba(0, 0, 0, 0.3);
	}

	.editor-container :global(.cm-scroller::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	.editor-container :global(.cm-scroller::-webkit-scrollbar-track) {
		background: rgba(0, 0, 0, 0.3);
	}

	.editor-container :global(.cm-scroller::-webkit-scrollbar-thumb) {
		background: linear-gradient(
			180deg,
			rgba(0, 255, 65, 0.6) 0%,
			rgba(0, 255, 65, 0.4) 50%,
			rgba(0, 255, 65, 0.6) 100%
		);
		border-radius: 4px;
	}

	.editor-container :global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(
			180deg,
			rgba(0, 255, 65, 0.8) 0%,
			rgba(0, 255, 65, 0.6) 50%,
			rgba(0, 255, 65, 0.8) 100%
		);
	}
</style>
