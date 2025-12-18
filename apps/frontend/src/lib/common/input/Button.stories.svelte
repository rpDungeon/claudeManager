<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "./Button.component.svelte";
import { ButtonVariant, ButtonSize } from "./button.lib";

const { Story } = defineMeta({
	argTypes: {
		disabled: {
			control: "boolean",
			description: "Disable the button",
		},
		loading: {
			control: "boolean",
			description: "Show loading spinner",
		},
		size: {
			control: "select",
			description: "Button size",
			options: Object.values(ButtonSize),
		},
		variant: {
			control: "select",
			description: "Button variant",
			options: Object.values(ButtonVariant),
		},
	},
	component: Button,
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
	title: "Common/Input/Button",
});
</script>

{#snippet template(args: any)}
	<div class="p-4">
		<Button {...args}>Button</Button>
	</div>
{/snippet}

<Story name="Primary" args={{ variant: ButtonVariant.Primary }} {template} />
<Story name="Secondary" args={{ variant: ButtonVariant.Secondary }} {template} />
<Story name="Ghost" args={{ variant: ButtonVariant.Ghost }} {template} />
<Story name="Danger" args={{ variant: ButtonVariant.Danger }} {template} />

{#snippet sizesTemplate(_args: any)}
	<div class="flex items-center gap-4 p-4">
		<Button variant={ButtonVariant.Primary} size={ButtonSize.Sm}>Small</Button>
		<Button variant={ButtonVariant.Primary} size={ButtonSize.Md}>Medium</Button>
		<Button variant={ButtonVariant.Primary} size={ButtonSize.Lg}>Large</Button>
	</div>
{/snippet}

<Story name="Sizes" args={{}} template={sizesTemplate} />

{#snippet disabledTemplate(_args: any)}
	<div class="flex items-center gap-4 p-4">
		<Button variant={ButtonVariant.Primary} disabled>Primary</Button>
		<Button variant={ButtonVariant.Secondary} disabled>Secondary</Button>
		<Button variant={ButtonVariant.Ghost} disabled>Ghost</Button>
		<Button variant={ButtonVariant.Danger} disabled>Danger</Button>
	</div>
{/snippet}

<Story name="Disabled" args={{}} template={disabledTemplate} />

{#snippet loadingTemplate(_args: any)}
	<div class="flex items-center gap-4 p-4">
		<Button variant={ButtonVariant.Primary} loading>Loading</Button>
		<Button variant={ButtonVariant.Secondary} loading>Processing</Button>
	</div>
{/snippet}

<Story name="Loading" args={{}} template={loadingTemplate} />

{#snippet allVariantsTemplate(_args: any)}
	<div class="flex flex-col gap-4 p-4">
		<div class="flex items-center gap-4">
			<Button variant={ButtonVariant.Primary}>Create Project</Button>
			<Button variant={ButtonVariant.Secondary}>Cancel</Button>
			<Button variant={ButtonVariant.Ghost}>Settings</Button>
			<Button variant={ButtonVariant.Danger}>Delete</Button>
		</div>
		<div class="flex items-center gap-4">
			<Button variant={ButtonVariant.Primary} size={ButtonSize.Sm}>Add</Button>
			<Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>Edit</Button>
			<Button variant={ButtonVariant.Danger} size={ButtonSize.Sm}>Remove</Button>
		</div>
	</div>
{/snippet}

<Story name="AllVariants" args={{}} template={allVariantsTemplate} />
