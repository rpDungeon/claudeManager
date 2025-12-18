<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import FileTree from "./FileTree.component.svelte";
import { FileTreeItemType, FileStatus, type FileTreeItemData } from "./fileTree.lib";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

const { Story } = defineMeta({
	component: FileTree,
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
	title: "FileTree/FileTree",
});

type ItemId = FileTreeItemData["id"];

function createTestData(): {
	items: SvelteMap<ItemId, FileTreeItemData>;
	parentMap: SvelteMap<ItemId, ItemId>;
} {
	const items = new SvelteMap<ItemId, FileTreeItemData>();
	const parentMap = new SvelteMap<ItemId, ItemId>();

	const data: Array<{
		item: FileTreeItemData;
		parent?: ItemId;
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
let expandedIds = new SvelteSet<ItemId>(["/project", "/project/src"]);
let selectedId = $state<ItemId | undefined>(undefined);

function handleSelect(itemId: ItemId) {
	console.log("Selected:", itemId);
}

function handleNodeMove(sourceId: ItemId, targetId: ItemId) {
	console.log("Move:", sourceId, "to", targetId);
}

function handleDoubleClick(itemId: ItemId) {
	console.log("Double click:", itemId);
}

function handleContextMenu(itemId: ItemId, event: MouseEvent) {
	console.log("Context menu:", itemId, event);
}
</script>

{#snippet template(_args: any)}
	<div class="w-[220px] bg-[#0d0d14] p-2">
		<FileTree
			rootId="/project"
			items={testData.items}
			parentMap={testData.parentMap}
			bind:selectedId
			{expandedIds}
			draggable
			onSelect={handleSelect}
			onNodeMove={handleNodeMove}
			onDoubleClick={handleDoubleClick}
			onContextMenu={handleContextMenu}
		/>
	</div>
{/snippet}

<Story name="Default" args={{}} {template} />

{#snippet draggableTemplate(_args: any)}
	<div class="w-[220px] bg-[#0d0d14] p-2">
		<FileTree
			rootId="/project"
			items={testData.items}
			parentMap={testData.parentMap}
			bind:selectedId
			{expandedIds}
			draggable
			onNodeMove={handleNodeMove}
		/>
	</div>
{/snippet}

<Story name="Draggable" args={{}} template={draggableTemplate} />
