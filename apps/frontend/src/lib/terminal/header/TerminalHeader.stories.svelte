<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import TerminalHeader from "./TerminalHeader.component.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

const { Story } = defineMeta({
	argTypes: {
		info: {
			control: "text",
			description: "Additional info (PID, runtime)",
		},
		isActive: {
			control: "boolean",
			description: "Pulsing indicator when active",
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
	component: TerminalHeader,
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
	},
	tags: [
		"autodocs",
	],
	title: "Terminal/TerminalHeader",
});
</script>

<Story name="Default" args={{ title: "shell" }} />

<Story name="WithInfo" args={{ title: "bun run dev", info: "PID 4821 | 2m 34s" }} />

<Story name="Active" args={{ title: "bun run dev", info: "PID 4821 | 2m 34s", isActive: true }} />

<Story name="Idle" args={{ title: "tail -f logs/app.log", info: "watching", isActive: false }} />

<Story name="Error" args={{ title: "npm start", info: "exit code 1", statusColor: IndicatorDotColor.Red }} />

<Story name="Warning" args={{ title: "build", info: "warnings", statusColor: IndicatorDotColor.Amber, isActive: true }} />

<Story name="Info" args={{ title: "claude", info: "session active", statusColor: IndicatorDotColor.Cyan, isActive: true }} />
