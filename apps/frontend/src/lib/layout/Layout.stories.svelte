<!-- Review pending by Autumnlight -->
<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Layout from "./Layout.component.svelte";
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { Percentage } from "@claude-manager/common/src/types/common.types";

const { Story } = defineMeta({
	component: Layout,
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
	title: "Layout/Layout",
});

const singleItemData: LayoutData = {
	desktop: {
		containers: {},
		rootId: "item-1",
	},
	items: {
		"item-1": {
			id: "item-1",
			label: "Example",
			type: "iframe",
			url: "https://example.com",
		},
	},
	mobile: {
		containers: {},
		rootId: "item-1",
	},
};

const tabsData: LayoutData = {
	desktop: {
		containers: {
			"tabs-1": {
				activeTabId: "item-1",
				childIds: [
					"item-1",
					"item-2",
					"item-3",
				],
				id: "tabs-1",
				type: "tabs",
			},
		},
		rootId: "tabs-1",
	},
	items: {
		"item-1": {
			id: "item-1",
			label: "Example",
			type: "iframe",
			url: "https://example.com",
		},
		"item-2": {
			id: "item-2",
			label: "Google",
			type: "iframe",
			url: "https://google.com",
		},
		"item-3": {
			content: "# Hello World",
			id: "item-3",
			label: "Notes",
			type: "markdown",
		},
	},
	mobile: {
		containers: {},
		rootId: "item-1",
	},
};

const horizontalSplitData: LayoutData = {
	desktop: {
		containers: {
			"split-1": {
				childIds: [
					"item-1",
					"item-2",
				],
				direction: "horizontal",
				id: "split-1",
				sizes: [
					50,
					50,
				] as Percentage[],
				type: "split",
			},
		},
		rootId: "split-1",
	},
	items: {
		"item-1": {
			id: "item-1",
			label: "Left",
			type: "iframe",
			url: "https://example.com",
		},
		"item-2": {
			id: "item-2",
			label: "Right",
			type: "iframe",
			url: "https://google.com",
		},
	},
	mobile: {
		containers: {},
		rootId: "item-1",
	},
};

const verticalSplitData: LayoutData = {
	desktop: {
		containers: {
			"split-1": {
				childIds: [
					"item-1",
					"item-2",
				],
				direction: "vertical",
				id: "split-1",
				sizes: [
					30,
					70,
				] as Percentage[],
				type: "split",
			},
		},
		rootId: "split-1",
	},
	items: {
		"item-1": {
			id: "item-1",
			label: "Top",
			type: "iframe",
			url: "https://example.com",
		},
		"item-2": {
			id: "item-2",
			label: "Bottom",
			type: "iframe",
			url: "https://google.com",
		},
	},
	mobile: {
		containers: {},
		rootId: "item-1",
	},
};

const nestedLayoutData: LayoutData = {
	desktop: {
		containers: {
			"main-area": {
				childIds: [
					"main-tabs",
					"bottom",
				],
				direction: "vertical",
				id: "main-area",
				sizes: [
					70,
					30,
				] as Percentage[],
				type: "split",
			},
			"main-tabs": {
				activeTabId: "main-1",
				childIds: [
					"main-1",
					"main-2",
				],
				id: "main-tabs",
				type: "tabs",
			},
			root: {
				childIds: [
					"sidebar",
					"main-area",
				],
				direction: "horizontal",
				id: "root",
				sizes: [
					20,
					80,
				] as Percentage[],
				type: "split",
			},
		},
		rootId: "root",
	},
	items: {
		bottom: {
			content: "# Console Output",
			id: "bottom",
			label: "Console",
			type: "markdown",
		},
		"main-1": {
			id: "main-1",
			label: "Editor",
			type: "iframe",
			url: "https://example.com",
		},
		"main-2": {
			id: "main-2",
			label: "Preview",
			type: "iframe",
			url: "https://google.com",
		},
		sidebar: {
			content: "# Sidebar",
			id: "sidebar",
			label: "Sidebar",
			type: "markdown",
		},
	},
	mobile: {
		containers: {
			"mobile-tabs": {
				activeTabId: "main-1",
				childIds: [
					"sidebar",
					"main-1",
					"main-2",
					"bottom",
				],
				id: "mobile-tabs",
				type: "tabs",
			},
		},
		rootId: "mobile-tabs",
	},
};

const threePaneData: LayoutData = {
	desktop: {
		containers: {
			root: {
				childIds: [
					"left",
					"center",
					"right",
				],
				direction: "horizontal",
				id: "root",
				sizes: [
					20,
					60,
					20,
				] as Percentage[],
				type: "split",
			},
		},
		rootId: "root",
	},
	items: {
		center: {
			id: "center",
			label: "Code",
			type: "iframe",
			url: "https://google.com",
		},
		left: {
			id: "left",
			label: "Files",
			type: "iframe",
			url: "https://example.com",
		},
		right: {
			content: "# Preview",
			id: "right",
			label: "Preview",
			type: "markdown",
		},
	},
	mobile: {
		containers: {},
		rootId: "center",
	},
};
</script>

{#snippet template(args: { data: LayoutData })}
	<div class="h-screen w-screen">
		<Layout {...args} />
	</div>
{/snippet}

<Story name="Single Item" args={{ data: singleItemData }} {template} />
<Story name="Tabs" args={{ data: tabsData }} {template} />
<Story name="Horizontal Split" args={{ data: horizontalSplitData }} {template} />
<Story name="Vertical Split" args={{ data: verticalSplitData }} {template} />
<Story name="Three Pane" args={{ data: threePaneData }} {template} />
<Story name="Nested Layout (IDE-like)" args={{ data: nestedLayoutData }} {template} />
<Story name="Mobile Mode" args={{ data: nestedLayoutData, mode: "mobile" }} {template} />
