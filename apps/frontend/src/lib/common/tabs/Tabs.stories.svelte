<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Tabs from "./Tabs.component.svelte";

const { Story } = defineMeta({
	argTypes: {
		activeId: {
			control: "text",
			description: "Currently active tab ID",
		},
	},
	component: Tabs,
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
	title: "Common/Tabs",
});
</script>

<script lang="ts">
let activeId = $state("workspace");

function handleSelect(id: string) {
	console.log("Selected tab:", id);
}
</script>

{#snippet template(_args: any)}
	<div class="p-4">
		<Tabs
			items={[
				{ id: "workspace", label: "Workspace" },
				{ id: "dashboard", label: "Dashboard" },
			]}
			bind:activeId
			onSelect={handleSelect}
		/>
	</div>
{/snippet}

<Story name="Default" args={{}} {template} />

{#snippet threeTabsTemplate(_args: any)}
	{@const items = [
		{ id: "files", label: "Files" },
		{ id: "search", label: "Search" },
		{ id: "git", label: "Git" },
	]}
	<div class="p-4">
		<Tabs {items} activeId="files" />
	</div>
{/snippet}

<Story name="ThreeTabs" args={{}} template={threeTabsTemplate} />

{#snippet disabledTemplate(_args: any)}
	{@const items = [
		{ id: "active", label: "Active" },
		{ id: "disabled", label: "Disabled", disabled: true },
		{ id: "another", label: "Another" },
	]}
	<div class="p-4">
		<Tabs {items} activeId="active" />
	</div>
{/snippet}

<Story name="WithDisabled" args={{}} template={disabledTemplate} />
