<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import TextInput from "./TextInput.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		disabled: {
			control: "boolean",
			description: "Disable the input",
		},
		label: {
			control: "text",
			description: "Label text above input",
		},
		placeholder: {
			control: "text",
			description: "Placeholder text",
		},
		readonly: {
			control: "boolean",
			description: "Make input read-only",
		},
		type: {
			control: "select",
			description: "Input type",
			options: [
				"text",
				"password",
				"email",
				"url",
				"search",
			],
		},
		value: {
			control: "text",
			description: "Input value",
		},
	},
	component: TextInput,
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
	title: "Common/Input/TextInput",
});
</script>

<script lang="ts">
let value = $state("");
</script>

{#snippet template(args: any)}
	<div class="w-[240px] p-4">
		<TextInput {...args} bind:value />
	</div>
{/snippet}

<Story
	name="Default"
	args={{
		placeholder: "Enter text...",
	}}
	{template}
/>

<Story
	name="WithLabel"
	args={{
		label: "Project Name",
		placeholder: "my-project",
	}}
	{template}
/>

<Story
	name="WithValue"
	args={{
		label: "Path",
		value: "/home/user/projects",
	}}
	{template}
/>

<Story
	name="Disabled"
	args={{
		disabled: true,
		label: "Disabled Input",
		value: "Cannot edit this",
	}}
	{template}
/>

<Story
	name="ReadOnly"
	args={{
		label: "Read Only",
		readonly: true,
		value: "Read-only value",
	}}
	{template}
/>

<Story
	name="Password"
	args={{
		label: "Password",
		placeholder: "Enter password...",
		type: "password",
	}}
	{template}
/>
