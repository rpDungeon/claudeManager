<!-- Review pending by Autumnlight -->
<!--
@component
name: Select
type: stupid
styleguide: 1.0.0
description: Dropdown select component with CRT theme styling
usage: Use for selecting from a list of options with optional label
-->
<script lang="ts" generics="T extends string">
interface Option {
	value: T;
	label: string;
}

interface Props {
	value?: T | null;
	options: Option[];
	placeholder?: string;
	label?: string;
	disabled?: boolean;
	id?: string;
	onchange?: (value: T) => void;
}

let {
	value = $bindable(null),
	options,
	placeholder = "Select...",
	label,
	disabled = false,
	id,
	onchange,
}: Props = $props();

const fallbackId = crypto.randomUUID();
const selectId = $derived(id ?? fallbackId);

function handleChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	const newValue = target.value as T;
	value = newValue || null;
	onchange?.(newValue);
}
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<label
			for={selectId}
			class="text-[10px] font-medium uppercase tracking-wide text-text-secondary"
		>
			{label}
		</label>
	{/if}
	<select
		id={selectId}
		{disabled}
		value={value ?? ""}
		onchange={handleChange}
		class="rounded border border-border-default bg-bg-surface px-2 py-1.5 font-mono text-[11px] text-text-primary
			focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green/30
			disabled:cursor-not-allowed disabled:opacity-50
			appearance-none bg-no-repeat bg-right pr-6"
		style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-position: right 6px center;"
	>
		{#if placeholder}
			<option value="" disabled class="text-text-tertiary">{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>
