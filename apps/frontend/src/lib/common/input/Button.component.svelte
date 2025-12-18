<!--
@component
name: Button
type: stupid
styleguide: 1.0.0
description: Button component with multiple variants and sizes in CRT theme
usage: Use for actions with variant (primary, secondary, ghost, danger) and size options
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { ButtonVariant, ButtonSize, buttonVariantClasses, buttonSizeClasses } from "./button.lib";

interface Props {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
	onclick?: (event: MouseEvent) => void;
	children?: Snippet;
}

let {
	variant = ButtonVariant.Secondary,
	size = ButtonSize.Md,
	disabled = false,
	loading = false,
	type = "button",
	onclick,
	children,
}: Props = $props();

const variantClass = $derived(buttonVariantClasses[variant]);
const sizeClass = $derived(buttonSizeClasses[size]);
const isDisabled = $derived(disabled || loading);
</script>

<button
	{type}
	disabled={isDisabled}
	class="inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all duration-150
		{variantClass}
		{sizeClass}
		{isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	{onclick}
>
	{#if loading}
		<span class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
