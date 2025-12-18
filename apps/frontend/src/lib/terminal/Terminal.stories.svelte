<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Terminal from "./Terminal.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

const { Story } = defineMeta({
	argTypes: {
		info: {
			control: "text",
			description: "Additional info (PID, runtime)",
		},
		isActive: {
			control: "boolean",
			description: "Active state with green outline",
		},
		statusColor: {
			control: "select",
			description: "Status indicator color",
			options: Object.values(IndicatorDotColor),
		},
		title: {
			control: "text",
			description: "Command or shell name",
		},
	},
	component: Terminal,
	parameters: {
		backgrounds: {
			default: "void",
			values: [
				{
					name: "void",
					value: "#0a0a0a",
				},
			],
		},
		layout: "fullscreen",
	},
	tags: [
		"autodocs",
	],
	title: "Terminal/Terminal",
});
</script>

{#snippet template(args: any)}
	<div class="h-[400px] w-full bg-bg-void p-4">
		<Terminal {...args} />
	</div>
{/snippet}

<Story name="Default" args={{ title: "shell" }} {template} />

<Story name="Active" args={{ title: "bun run dev", info: "PID 4821 | 2m 34s", isActive: true }} {template} />

<Story name="Inactive" args={{ title: "tail -f logs/app.log", info: "watching", isActive: false }} {template} />

<Story name="Error" args={{ title: "npm start", info: "exit code 1", statusColor: IndicatorDotColor.Red }} {template} />

<Story name="Claude Session" args={{ title: "claude", info: "session active", statusColor: IndicatorDotColor.Cyan, isActive: true }} {template} />
