<!-- Review pending by Autumnlight -->
<!--
@component
name: DashboardSelector
type: stupid
styleguide: 1.0.0
description: Dropdown selector row with settings button for project/layout selection
usage: Use for selecting projects or layouts in the dashboard sidebar
-->
<script lang="ts" generics="T extends string">
import { Settings } from "lucide-svelte";

interface Option {
	value: T;
	label: string;
}

interface Props {
	value?: T | null;
	options: Option[];
	placeholder?: string;
	disabled?: boolean;
	onchange?: (value: T) => void;
	onSettingsClick?: () => void;
	onAddClick?: () => void;
}

let {
	value = $bindable(null),
	options,
	placeholder = "Select...",
	disabled = false,
	onchange,
	onSettingsClick,
	onAddClick,
}: Props = $props();

function handleChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	const newValue = target.value as T;
	value = newValue || null;
	onchange?.(newValue);
}
</script>

<div class="flex items-center gap-1 px-2">
	<select
		{disabled}
		value={value ?? ""}
		onchange={handleChange}
		class="flex-1 min-w-0 rounded border border-border-default bg-bg-surface px-2 py-1 font-mono text-[10px] text-text-primary
			focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green/30
			disabled:cursor-not-allowed disabled:opacity-50
			appearance-none bg-no-repeat pr-5 truncate"
		style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-position: right 4px center;"
	>
		{#if placeholder && !value}
			<option value="" disabled class="text-text-tertiary">{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if onAddClick}
		<button
			type="button"
			class="flex size-5 items-center justify-center rounded text-text-tertiary
				hover:bg-bg-elevated hover:text-terminal-green
				transition-colors duration-100"
			title="Add new"
			onclick={onAddClick}
		>
			<span class="text-[12px]">+</span>
		</button>
	{/if}

	{#if onSettingsClick}
		<button
			type="button"
			class="flex size-5 items-center justify-center rounded text-text-tertiary
				hover:bg-bg-elevated hover:text-text-secondary
				transition-colors duration-100"
			title="Settings"
			onclick={onSettingsClick}
			disabled={!value}
		>
			<Settings class="size-3" />
		</button>
	{/if}
</div>
