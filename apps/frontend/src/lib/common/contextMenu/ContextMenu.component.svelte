<!--
@component
name: ContextMenu
type: stupid
styleguide: 1.0.0
description: Floating context menu with action items, toggles, and dividers
usage: Pass items array and position to render a context menu at specific coordinates
-->
<script lang="ts" generics="TId extends string = string">
import { tick } from "svelte";
import { ContextMenuItemType, type ContextMenuItem, type ContextMenuPosition } from "./contextMenu.lib";

interface Props {
	items: ContextMenuItem<TId>[];
	position: ContextMenuPosition;
	onAction?: (id: TId) => void;
	onToggle?: (id: TId, checked: boolean) => void;
	onClose?: () => void;
}

let { items, position, onAction, onToggle, onClose }: Props = $props();
let menuRef: HTMLDivElement | undefined = $state();
let menuX = $state<number | null>(null);
let menuY = $state<number | null>(null);

function updateMenuPosition() {
	if (!menuRef) {
		menuX = position.x;
		menuY = position.y;
		return;
	}

	const margin = 8;
	const rect = menuRef.getBoundingClientRect();
	const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
	const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
	menuX = Math.min(Math.max(position.x, margin), maxX);
	menuY = Math.min(Math.max(position.y, margin), maxY);
}

$effect(() => {
	position.x;
	position.y;
	items;

	void tick().then(updateMenuPosition);
	window.addEventListener("resize", updateMenuPosition);

	const resizeObserver = new ResizeObserver(updateMenuPosition);
	if (menuRef) {
		resizeObserver.observe(menuRef);
	}

	return () => {
		window.removeEventListener("resize", updateMenuPosition);
		resizeObserver.disconnect();
	};
});

function handleAction(id: TId, disabled?: boolean) {
	if (disabled) return;
	onAction?.(id);
	onClose?.();
}

function handleToggle(id: TId, currentChecked: boolean, disabled?: boolean) {
	if (disabled) return;
	onToggle?.(id, !currentChecked);
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		onClose?.();
	}
}

function handleBackdropClick() {
	onClose?.();
}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="fixed inset-0 z-50"
	onpointerdown={handleBackdropClick}
	onkeydown={handleKeyDown}
	role="presentation"
>
	<div
		bind:this={menuRef}
		class="absolute min-w-[160px] max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded border border-border-default bg-bg-elevated py-1 shadow-lg shadow-black/50"
		style:left="{menuX ?? position.x}px"
		style:top="{menuY ?? position.y}px"
		role="menu"
		tabindex="-1"
		onpointerdown={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		{#each items as item, index (item.type === ContextMenuItemType.Divider ? `divider-${index}` : item.type === ContextMenuItemType.Action ? item.id : item.id)}
			{#if item.type === ContextMenuItemType.Divider}
				<div class="my-1 h-px bg-border-default"></div>
			{:else if item.type === ContextMenuItemType.Action}
				<button
					type="button"
					role="menuitem"
					disabled={item.disabled}
					class="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[11px] transition-colors
						{item.danger ? 'text-terminal-red hover:bg-terminal-red/10' : 'text-text-primary hover:bg-bg-surface'}
						{item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
					onpointerdown={() => handleAction(item.id, item.disabled)}
				>
					<span>{item.label}</span>
					{#if item.shortcut}
						<span class="text-[10px] text-text-tertiary">{item.shortcut}</span>
					{/if}
				</button>
			{:else if item.type === ContextMenuItemType.Toggle}
				<button
					type="button"
					role="menuitemcheckbox"
					aria-checked={item.checked}
					disabled={item.disabled}
					class="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[11px] text-text-primary transition-colors hover:bg-bg-surface
						{item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
					onpointerdown={() => handleToggle(item.id, item.checked, item.disabled)}
				>
					<span>{item.label}</span>
					<span
						class="flex size-3.5 items-center justify-center rounded border text-[10px]
							{item.checked
							? 'border-terminal-green bg-terminal-green/20 text-terminal-green'
							: 'border-border-default text-transparent'}"
					>
						✓
					</span>
				</button>
			{/if}
		{/each}
	</div>
</div>
