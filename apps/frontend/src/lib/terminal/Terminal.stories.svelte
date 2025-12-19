<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Terminal from "./Terminal.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		autoConnect: {
			control: "boolean",
			description: "Auto-connect to PTY on mount",
		},
		info: {
			control: "text",
			description: "Additional info (PID, runtime)",
		},
		isActive: {
			control: "boolean",
			description: "Active state with green outline",
		},
		terminalId: {
			control: "text",
			description: "Terminal ID for PTY connection",
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

<Story name="DisplayOnly" args={{ title: "shell" }} {template} />

<Story name="Active" args={{ title: "bun run dev", info: "PID 4821 | 2m 34s", isActive: true }} {template} />

<Story name="Inactive" args={{ title: "tail -f logs/app.log", info: "watching", isActive: false }} {template} />
