<!--
@component
name: ContextMenu
type: stupid
styleguide: 1.0.0
description: Floating context menu with action items, toggles, and dividers
usage: Pass items array and position to render a context menu at specific coordinates
-->
<script lang="ts">
import { ContextMenuItemType, type ContextMenuItem, type ContextMenuPosition } from "./contextMenu.lib";

interface Props {
	items: ContextMenuItem[];
	position: ContextMenuPosition;
	onAction?: (id: string) => void;
	onToggle?: (id: string, checked: boolean) => void;
	onClose?: () => void;
}

let { items, position, onAction, onToggle, onClose }: Props = $props();

function handleAction(id: string, disabled?: boolean) {
	if (disabled) return;
	onAction?.(id);
	onClose?.();
}

function handleToggle(id: string, currentChecked: boolean, disabled?: boolean) {
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
	onclick={handleBackdropClick}
	onkeydown={handleKeyDown}
	role="presentation"
>
	<div
		class="absolute min-w-[160px] rounded border border-border-default bg-bg-elevated py-1 shadow-lg shadow-black/50"
		style:left="{position.x}px"
		style:top="{position.y}px"
		role="menu"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
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
					onclick={() => handleAction(item.id, item.disabled)}
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
					onclick={() => handleToggle(item.id, item.checked, item.disabled)}
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
