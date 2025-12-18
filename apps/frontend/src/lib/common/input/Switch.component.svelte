<!--
@component
name: Switch
type: stupid
styleguide: 1.0.0
description: iOS-style switch for on/off states with larger touch target
usage: Use for prominent boolean settings, larger than Toggle
-->
<script lang="ts">
interface Props {
	checked?: boolean;
	label?: string;
	description?: string;
	disabled?: boolean;
	name?: string;
	id?: string;
	onchange?: (checked: boolean) => void;
}

let { checked = $bindable(false), label, description, disabled = false, name, id, onchange }: Props = $props();

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

<div class="flex items-start gap-3">
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-labelledby={label ? `${inputId}-label` : undefined}
		aria-describedby={description ? `${inputId}-desc` : undefined}
		{disabled}
		class="relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200
			{checked
			? 'bg-terminal-green shadow-[0_0_10px_var(--color-terminal-green)/40]'
			: 'bg-bg-surface border border-border-default'}
			{disabled ? 'cursor-not-allowed opacity-50' : ''}"
		onclick={handleToggle}
		onkeydown={handleKeyDown}
	>
		<span
			class="absolute top-0.5 size-4 rounded-full shadow-sm transition-all duration-200
				{checked ? 'left-[18px] bg-bg-void' : 'left-0.5 bg-text-secondary'}"
		></span>
	</button>
	{#if label || description}
		<div class="flex flex-col gap-0.5">
			{#if label}
				<label
					id="{inputId}-label"
					for={inputId}
					class="text-[12px] font-medium text-text-primary {disabled ? 'opacity-50' : 'cursor-pointer'}"
					onclick={handleToggle}
					onkeydown={handleKeyDown}
					role="presentation"
				>
					{label}
				</label>
			{/if}
			{#if description}
				<span
					id="{inputId}-desc"
					class="text-[10px] text-text-tertiary {disabled ? 'opacity-50' : ''}"
				>
					{description}
				</span>
			{/if}
		</div>
	{/if}
	<input type="checkbox" {name} id={inputId} bind:checked {disabled} class="sr-only" />
</div>
