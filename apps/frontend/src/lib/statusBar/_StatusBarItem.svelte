<script lang="ts">
import type { Snippet } from "svelte";
import IndicatorDot from "$lib/common/IndicatorDot.component.svelte";
import type { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

interface Props {
	indicator?: IndicatorDotColor;
	children: Snippet;
}

let { indicator, children }: Props = $props();
</script>

<div class="flex items-center gap-1.5">
	{#if indicator}
		<IndicatorDot color={indicator} glow />
	{/if}
	{@render children()}
</div>
