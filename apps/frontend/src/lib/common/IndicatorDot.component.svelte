<!--
@component
name: IndicatorDot
type: stupid
styleguide: 1.0.0
description: Small colored status indicator dot with optional glow and pulse animation
usage: Display status in headers, status bars, and list items
-->
<script lang="ts">
import {
	IndicatorDotColor,
	indicatorDotColorMap,
	indicatorDotGlowMap,
} from "./indicatorDot.lib";

interface Props {
	color?: IndicatorDotColor;
	glow?: boolean;
	pulse?: boolean;
	size?: "sm" | "md";
}

let {
	color = IndicatorDotColor.Green,
	glow = false,
	pulse = false,
	size = "sm",
}: Props = $props();

const sizeClass = $derived(size === "sm" ? "size-1" : "size-1.5");
const colorClass = $derived(indicatorDotColorMap[color]);
const glowClass = $derived(glow ? indicatorDotGlowMap[color] : "");
</script>

<span
	class="rounded-full {sizeClass} {colorClass} {glowClass}"
	class:animate-pulse={pulse}
></span>
