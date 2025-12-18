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
	class="flex h-[22px] items-center gap-4 border-t border-border-default bg-bg-surface px-3 text-[10px] text-text-secondary"
>
	{#if left}
		<div class="flex items-center gap-4">
			{@render left()}
		</div>
	{/if}

	{#if right}
		<div class="ml-auto flex items-center gap-4">
			{@render right()}
		</div>
	{/if}
</footer>
