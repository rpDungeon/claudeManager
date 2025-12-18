<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Switch from "./Switch.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		checked: {
			control: "boolean",
			description: "Switch state",
		},
		description: {
			control: "text",
			description: "Description text below label",
		},
		disabled: {
			control: "boolean",
			description: "Disable the switch",
		},
		label: {
			control: "text",
			description: "Label text",
		},
	},
	component: Switch,
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
	title: "Common/Input/Switch",
});
</script>

<script lang="ts">
let checked = $state(false);

function handleChange(value: boolean) {
	console.log("Switch changed:", value);
}
</script>

{#snippet template(args: any)}
	<div class="p-4">
		<Switch {...args} bind:checked onchange={handleChange} />
	</div>
{/snippet}

<Story name="Default" args={{}} {template} />

<Story
	name="WithLabel"
	args={{
		label: "Enable dark mode",
	}}
	{template}
/>

<Story
	name="WithDescription"
	args={{
		description: "Automatically sync your settings across devices",
		label: "Cloud sync",
	}}
	{template}
/>

{#snippet checkedTemplate(_args: any)}
	<div class="p-4">
		<Switch label="Notifications enabled" description="You'll receive push notifications" checked={true} />
	</div>
{/snippet}

<Story name="Checked" args={{}} template={checkedTemplate} />

{#snippet disabledTemplate(_args: any)}
	<div class="flex flex-col gap-4 p-4">
		<Switch label="Disabled off" description="This setting is locked" disabled />
		<Switch label="Disabled on" description="This setting is locked" disabled checked={true} />
	</div>
{/snippet}

<Story name="Disabled" args={{}} template={disabledTemplate} />

{#snippet settingsTemplate(_args: any)}
	<div class="flex w-[280px] flex-col gap-4 rounded border border-border-default bg-bg-surface p-4">
		<div class="text-[11px] font-medium uppercase tracking-wide text-text-secondary">Settings</div>
		<Switch label="Auto-save" description="Save files automatically" checked={true} />
		<Switch label="Spell check" description="Check spelling as you type" />
		<Switch label="Format on save" description="Run formatter when saving" checked={true} />
		<Switch label="Telemetry" description="Help improve the app" disabled />
	</div>
{/snippet}

<Story name="SettingsPanel" args={{}} template={settingsTemplate} />
