<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Toggle from "./Toggle.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		checked: {
			control: "boolean",
			description: "Toggle state",
		},
		disabled: {
			control: "boolean",
			description: "Disable the toggle",
		},
		label: {
			control: "text",
			description: "Label text next to toggle",
		},
	},
	component: Toggle,
	parameters: {
		backgrounds: {
			default: "elevated",
			values: [
				{
					name: "elevated",
					value: "#121212",
				},
			],
		},
	},
	tags: [
		"autodocs",
	],
	title: "Common/Input/Toggle",
});
</script>

<script lang="ts">
let checked = $state(false);

function handleChange(value: boolean) {
	console.log("Toggle changed:", value);
}
</script>

{#snippet template(args: any)}
	<div class="p-4">
		<Toggle {...args} bind:checked onchange={handleChange} />
	</div>
{/snippet}

<Story name="Default" args={{}} {template} />

<Story
	name="WithLabel"
	args={{
		label: "Enable notifications",
	}}
	{template}
/>

{#snippet checkedTemplate(_args: any)}
	<div class="p-4">
		<Toggle label="Auto-save enabled" checked={true} />
	</div>
{/snippet}

<Story name="Checked" args={{}} template={checkedTemplate} />

{#snippet disabledTemplate(_args: any)}
	<div class="flex flex-col gap-4 p-4">
		<Toggle label="Disabled off" disabled />
		<Toggle label="Disabled on" disabled checked={true} />
	</div>
{/snippet}

<Story name="Disabled" args={{}} template={disabledTemplate} />

{#snippet multipleTemplate(_args: any)}
	<div class="flex flex-col gap-3 p-4">
		<Toggle label="Dark mode" />
		<Toggle label="Sound effects" checked={true} />
		<Toggle label="Auto-update" />
		<Toggle label="Telemetry" disabled />
	</div>
{/snippet}

<Story name="Multiple" args={{}} template={multipleTemplate} />
