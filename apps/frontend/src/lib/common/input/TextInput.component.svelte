<!--
@component
name: TextInput
type: stupid
styleguide: 1.0.0
description: Text input field with CRT theme styling
usage: Use for single-line text input with optional label and placeholder
-->
<script lang="ts">
interface Props {
	value?: string;
	placeholder?: string;
	label?: string;
	disabled?: boolean;
	readonly?: boolean;
	type?: "text" | "password" | "email" | "url" | "search";
	name?: string;
	id?: string;
	oninput?: (event: Event) => void;
	onchange?: (event: Event) => void;
	onblur?: (event: FocusEvent) => void;
	onfocus?: (event: FocusEvent) => void;
}

let {
	value = $bindable(""),
	placeholder = "",
	label,
	disabled = false,
	readonly = false,
	type = "text",
	name,
	id,
	oninput,
	onchange,
	onblur,
	onfocus,
}: Props = $props();

const fallbackId = crypto.randomUUID();
const inputId = $derived(id ?? fallbackId);
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<label
			for={inputId}
			class="text-[10px] font-medium uppercase tracking-wide text-text-secondary"
		>
			{label}
		</label>
	{/if}
	<input
		{type}
		{name}
		id={inputId}
		bind:value
		{placeholder}
		{disabled}
		{readonly}
		{oninput}
		{onchange}
		{onblur}
		{onfocus}
		class="rounded border border-border-default bg-bg-surface px-2 py-1.5 font-mono text-[11px] text-text-primary
			placeholder:text-text-tertiary
			focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green/30
			disabled:cursor-not-allowed disabled:opacity-50
			read-only:cursor-default read-only:bg-bg-void"
	/>
</div>
