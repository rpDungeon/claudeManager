<!--
@component
name: Toggle
type: stupid
styleguide: 1.0.0
description: Toggle switch for boolean settings with CRT theme styling
usage: Use for on/off settings with optional label
-->
<script lang="ts">
interface Props {
	checked?: boolean;
	label?: string;
	disabled?: boolean;
	name?: string;
	id?: string;
	onchange?: (checked: boolean) => void;
}

let { checked = $bindable(false), label, disabled = false, name, id, onchange }: Props = $props();

const fallbackId = crypto.randomUUID();
const inputId = $derived(id ?? fallbackId);

function handleToggle() {
	if (disabled) return;
	checked = !checked;
	onchange?.(checked);
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		handleToggle();
	}
}
</script>

<div class="flex items-center gap-2">
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-labelledby={label ? `${inputId}-label` : undefined}
		{disabled}
		class="relative h-4 w-7 shrink-0 cursor-pointer rounded-full border transition-colors duration-150
			{checked
			? 'border-terminal-green/50 bg-terminal-green/20'
			: 'border-border-default bg-bg-surface'}
			{disabled ? 'cursor-not-allowed opacity-50' : ''}"
		onclick={handleToggle}
		onkeydown={handleKeyDown}
	>
		<span
			class="absolute top-0.5 size-2.5 rounded-full transition-all duration-150
				{checked
				? 'left-3.5 bg-terminal-green shadow-[0_0_6px_var(--color-terminal-green)]'
				: 'left-0.5 bg-text-secondary'}"
		></span>
	</button>
	{#if label}
		<label
			id="{inputId}-label"
			for={inputId}
			class="text-[11px] text-text-secondary {disabled ? 'opacity-50' : 'cursor-pointer'}"
			onclick={handleToggle}
			onkeydown={handleKeyDown}
			role="presentation"
		>
			{label}
		</label>
	{/if}
	<input
		type="checkbox"
		{name}
		id={inputId}
		bind:checked
		{disabled}
		class="sr-only"
	/>
</div>
