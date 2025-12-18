<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import TerminalBody from "./TerminalBody.component.svelte";
import TerminalHeader from "../header/TerminalHeader.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		isActive: {
			control: "boolean",
			description: "Shows green outline when active",
		},
	},
	component: TerminalBody,
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
	title: "Terminal/TerminalBody",
});
</script>

{#snippet template(args: { isActive?: boolean })}
	<div class="h-[400px] w-full bg-bg-void p-4">
		<TerminalBody {...args} />
	</div>
{/snippet}

<Story name="Default" args={{ isActive: false }} {template} />

<Story name="Active" args={{ isActive: true }} {template} />

{#snippet withHeaderTemplate()}
	<div class="flex h-[400px] w-full flex-col bg-bg-void p-4">
		<TerminalHeader title="bun run dev" info="PID 4821 | 2m 34s" isActive={true} />
		<TerminalBody isActive={true} />
	</div>
{/snippet}

<Story name="WithHeader" template={withHeaderTemplate} />
