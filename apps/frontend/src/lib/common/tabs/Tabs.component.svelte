<!--
@component
name: Tabs
type: stupid
styleguide: 1.0.0
description: Segmented toggle tabs for switching between views (e.g., Workspace/Dashboard)
usage: Pass items array and activeId to render toggle tabs with selection callback
-->
<script lang="ts">
import type { TabItem } from "./tabs.lib";

interface Props {
	items: TabItem[];
	activeId: string;
	onSelect?: (id: string) => void;
}

let { items, activeId, onSelect }: Props = $props();

function handleClick(id: string, disabled?: boolean) {
	if (disabled) return;
	onSelect?.(id);
}

function handleKeyDown(event: KeyboardEvent, id: string, disabled?: boolean) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		handleClick(id, disabled);
	}
}
</script>

<div class="flex gap-1 rounded bg-bg-surface p-0.5" role="tablist">
	{#each items as item (item.id)}
		<button
			type="button"
			role="tab"
			aria-selected={activeId === item.id}
			aria-disabled={item.disabled}
			class="rounded-[3px] px-2.5 py-1 text-[11px] font-medium transition-colors duration-150
				{activeId === item.id
				? 'bg-bg-elevated text-text-primary'
				: 'text-text-secondary hover:text-text-primary'}
				{item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
			onclick={() => handleClick(item.id, item.disabled)}
			onkeydown={(e) => handleKeyDown(e, item.id, item.disabled)}
			disabled={item.disabled}
		>
			{item.label}
		</button>
	{/each}
</div>
