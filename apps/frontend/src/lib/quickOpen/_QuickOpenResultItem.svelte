<!--
@component
name: QuickOpenResultItem
type: stupid
styleguide: 1.0.0
description: Single result item in Quick Open list
usage: Internal component for QuickOpen results
-->
<script lang="ts">
import { FileText } from "lucide-svelte";
import type { QuickOpenResult } from "./quickOpen.lib";

interface Props {
	isSelected?: boolean;
	onclick?: () => void;
	result: QuickOpenResult;
}

let { isSelected = false, onclick, result }: Props = $props();
</script>

<button
	type="button"
	class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors {isSelected
		? 'bg-terminal-green/10 text-terminal-green'
		: 'text-text-primary hover:bg-bg-elevated'}"
	{onclick}
>
	<FileText class="size-4 flex-shrink-0 {isSelected ? 'text-terminal-green' : 'text-text-tertiary'}" />
	<div class="min-w-0 flex-1">
		<div class="truncate text-sm {isSelected ? 'text-terminal-green' : 'text-text-primary'}">
			{result.primary}
		</div>
		{#if result.secondary}
			<div class="truncate text-xs {isSelected ? 'text-terminal-green/70' : 'text-text-tertiary'}">
				{result.secondary}
			</div>
		{/if}
	</div>
	{#if result.line}
		<span class="flex-shrink-0 text-xs {isSelected ? 'text-terminal-green/70' : 'text-text-tertiary'}">
			:{result.line}
		</span>
	{/if}
</button>
