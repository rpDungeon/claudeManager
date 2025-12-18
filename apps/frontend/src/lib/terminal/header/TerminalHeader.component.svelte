<!--
@component
name: TerminalHeader
type: smart
styleguide: 1.0.0
description: Minimal terminal pane header with status indicator, title, and info
usage: Display command name and status at the top of a terminal pane
-->
<script lang="ts">
import type { Snippet } from "svelte";
import IndicatorDot from "$lib/common/IndicatorDot.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

interface Props {
	title?: string | Snippet;
	info?: string | Snippet;
	isActive?: boolean;
	statusColor?: IndicatorDotColor;
	onclick?: (event: MouseEvent) => void;
}

let { title = "shell", info, isActive = false, statusColor = IndicatorDotColor.Green, onclick }: Props = $props();

const titleIsSnippet = $derived(typeof title === "function");
const infoIsSnippet = $derived(typeof info === "function");
</script>

<button
	type="button"
	class="flex h-5 w-full items-center gap-1.5 border-b border-border-default bg-bg-surface px-2 text-[10px] hover:bg-bg-elevated"
	{onclick}
>
	<IndicatorDot color={statusColor} glow pulse={isActive} />
	<span class="font-normal text-text-tertiary">
		{#if titleIsSnippet}
			{@render (title as Snippet)()}
		{:else}
			{title}
		{/if}
	</span>
	{#if info}
		<span class="ml-auto text-[9px] text-text-tertiary">
			{#if infoIsSnippet}
				{@render (info as Snippet)()}
			{:else}
				{info}
			{/if}
		</span>
	{/if}
</button>
