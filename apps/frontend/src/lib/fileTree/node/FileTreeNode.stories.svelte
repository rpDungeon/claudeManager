<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import FileTreeNode from "./FileTreeNode.component.svelte";
import { FileTreeItemType, FileStatus, type FileTreeItemData } from "../fileTree.lib";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

const { Story } = defineMeta({
	component: FileTreeNode,
	parameters: {
		backgrounds: {
			default: "sidebar",
			values: [
				{
					name: "sidebar",
					value: "#0d0d14",
				},
			],
		},
	},
	tags: [
		"autodocs",
	],
	title: "FileTree/FileTreeNode",
});

function createTestData(): {
	items: SvelteMap<string, FileTreeItemData>;
	parentMap: Map<string, string>;
} {
	const items = new SvelteMap<string, FileTreeItemData>();
	const parentMap = new Map<string, string>();

	const data: Array<{
		item: FileTreeItemData;
		parent?: string;
	}> = [
		{
			item: {
				id: "/project",
				name: "project",
				status: FileStatus.Modified,
				type: FileTreeItemType.Folder,
			},
		},
		{
			item: {
				id: "/project/src",
				name: "src",
				status: FileStatus.Modified,
				type: FileTreeItemType.Folder,
			},
			parent: "/project",
		},
		{
			item: {
				id: "/project/src/index.ts",
				meta: "+24",
				name: "index.ts",
				status: FileStatus.Modified,
				type: FileTreeItemType.File,
			},
			parent: "/project/src",
		},
		{
			item: {
				id: "/project/src/utils.ts",
				name: "utils.ts",
				status: FileStatus.Staged,
				type: FileTreeItemType.File,
			},
			parent: "/project/src",
		},
		{
			item: {
				id: "/project/src/components",
				name: "components",
				status: FileStatus.Clean,
				type: FileTreeItemType.Folder,
			},
			parent: "/project/src",
		},
		{
			item: {
				id: "/project/src/components/Button.svelte",
				name: "Button.svelte",
				status: FileStatus.Clean,
				type: FileTreeItemType.File,
			},
			parent: "/project/src/components",
		},
		{
			item: {
				id: "/project/src/components/Modal.svelte",
				meta: "+156",
				name: "Modal.svelte",
				status: FileStatus.Untracked,
				type: FileTreeItemType.File,
			},
			parent: "/project/src/components",
		},
		{
			item: {
				id: "/project/package.json",
				name: "package.json",
				status: FileStatus.Clean,
				type: FileTreeItemType.File,
			},
			parent: "/project",
		},
		{
			item: {
				id: "/project/README.md",
				name: "README.md",
				status: FileStatus.Conflicted,
				type: FileTreeItemType.File,
			},
			parent: "/project",
		},
	];

	for (const { item, parent } of data) {
		items.set(item.id, item);
		if (parent) {
			parentMap.set(item.id, parent);
		}
	}

	return {
		items,
		parentMap,
	};
}
</script>

<script lang="ts">
const testData = createTestData();
let expandedIds = new SvelteSet<string>(["/project", "/project/src"]);
let selectedId = $state<string | undefined>(undefined);

function handleToggle(itemId: string) {
	if (expandedIds.has(itemId)) {
		expandedIds.delete(itemId);
	} else {
		expandedIds.add(itemId);
	}
}

function handleSelect(itemId: string) {
	selectedId = itemId;
}
</script>

{#snippet template(_args: any)}
	<div class="w-[220px] bg-[#0d0d14] p-1">
		<FileTreeNode
			itemId="/project"
			items={testData.items}
			parentMap={testData.parentMap}
			{expandedIds}
			{selectedId}
			onToggle={handleToggle}
			onSelect={handleSelect}
		/>
	</div>
{/snippet}

<Story name="Default" args={{}} {template} />

{#snippet singleFileTemplate(_args: any)}
	{@const items = new SvelteMap<string, FileTreeItemData>([
		["/file.ts", { id: "/file.ts", name: "standalone-file.ts", status: FileStatus.Modified, type: FileTreeItemType.File }],
	])}
	{@const parentMap = new Map<string, string>()}
	<div class="w-[220px] bg-[#0d0d14] p-1">
		<FileTreeNode
			itemId="/file.ts"
			{items}
			{parentMap}
		/>
	</div>
{/snippet}

<Story name="SingleFile" args={{}} template={singleFileTemplate} />

{#snippet loadingTemplate(_args: any)}
	{@const items = new SvelteMap<string, FileTreeItemData>([
		["/loading-folder", { id: "/loading-folder", isLoading: true, name: "loading-folder", status: FileStatus.Clean, type: FileTreeItemType.Folder }],
	])}
	{@const parentMap = new Map<string, string>()}
	{@const expandedIds = new SvelteSet<string>(["/loading-folder"])}
	<div class="w-[220px] bg-[#0d0d14] p-1">
		<FileTreeNode
			itemId="/loading-folder"
			{items}
			{parentMap}
			{expandedIds}
		/>
	</div>
{/snippet}

<Story name="Loading" args={{}} template={loadingTemplate} />

{#snippet notFoundTemplate(_args: any)}
	{@const items = new SvelteMap<string, FileTreeItemData>()}
	{@const parentMap = new Map<string, string>()}
	<div class="w-[220px] bg-[#0d0d14] p-1">
		<FileTreeNode
			itemId="/does-not-exist"
			{items}
			{parentMap}
		/>
	</div>
{/snippet}

<Story name="NotFound" args={{}} template={notFoundTemplate} />
