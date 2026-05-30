<!--
@component
name: StatusBar
type: smart
styleguide: 1.0.0
description: Application footer status bar with customizable left and right content
usage: Display at the bottom of the app to show session status, CPU/MEM usage, and time
-->
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	left?: Snippet;
	right?: Snippet;
}

let { left, right }: Props = $props();
</script>

<footer
	class="scrollbar-none flex h-[22px] min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-border-default bg-bg-surface px-2 text-[10px] text-text-secondary md:gap-4 md:px-3"
>
	{#if left}
		<div class="flex shrink-0 items-center gap-2 md:gap-4">
			{@render left()}
		</div>
	{/if}

	{#if right}
		<div class="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
			{@render right()}
		</div>
	{/if}
</footer>
