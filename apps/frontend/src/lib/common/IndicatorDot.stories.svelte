<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import IndicatorDot from "./IndicatorDot.component.svelte";
import { IndicatorDotColor } from "./indicatorDot.lib";

const { Story } = defineMeta({
	argTypes: {
		color: {
			control: "select",
			description: "Dot color",
			options: Object.values(IndicatorDotColor),
		},
		glow: {
			control: "boolean",
			description: "Add glow effect",
		},
		pulse: {
			control: "boolean",
			description: "Animate pulse",
		},
		size: {
			control: "radio",
			description: "Dot size",
			options: [
				"sm",
				"md",
			],
		},
	},
	component: IndicatorDot,
	parameters: {
		backgrounds: {
			default: "surface",
			values: [
				{
					name: "surface",
					value: "#111111",
				},
				{
					name: "void",
					value: "#0a0a0a",
				},
			],
		},
	},
	tags: [
		"autodocs",
	],
	title: "Common/IndicatorDot",
});
</script>

{#snippet template(args: any)}
	<div class="flex items-center gap-4 p-4">
		<IndicatorDot {...args} />
	</div>
{/snippet}

<Story name="Default" args={{ color: IndicatorDotColor.Green }} {template} />

<Story name="WithGlow" args={{ color: IndicatorDotColor.Green, glow: true }} {template} />

<Story name="Pulsing" args={{ color: IndicatorDotColor.Green, glow: true, pulse: true }} {template} />

<Story name="AllColors" asChild>
	<div class="flex items-center gap-4 p-4">
		{#each Object.values(IndicatorDotColor) as color}
			<div class="flex flex-col items-center gap-2">
				<IndicatorDot {color} glow />
				<span class="text-[10px] text-text-tertiary">{color}</span>
			</div>
		{/each}
	</div>
</Story>

<Story name="Sizes" asChild>
	<div class="flex items-center gap-6 p-4">
		<div class="flex flex-col items-center gap-2">
			<IndicatorDot color={IndicatorDotColor.Green} glow size="sm" />
			<span class="text-[10px] text-text-tertiary">sm</span>
		</div>
		<div class="flex flex-col items-center gap-2">
			<IndicatorDot color={IndicatorDotColor.Green} glow size="md" />
			<span class="text-[10px] text-text-tertiary">md</span>
		</div>
	</div>
</Story>
