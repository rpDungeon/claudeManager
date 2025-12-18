<!--
@component
name: FileTreeNode
type: stupid
styleguide: 1.0.0
description: Recursive tree node that derives item data from flat maps and renders FileTreeItem
usage: Pass itemId with items and parentMap to render a tree node with its children
-->
<script lang="ts">
import type { SvelteMap, SvelteSet } from "svelte/reactivity";
import FileTreeItem from "../item/FileTreeItem.component.svelte";
import Self from "./FileTreeNode.component.svelte";
import {
	FileTreeItemType,
	FILETREE_NOTFOUND_ITEM,
	type FileTreeItemData,
	type FileTreeDragData,
} from "../fileTree.lib";

type ItemId = FileTreeItemData["id"];

interface Props {
	itemId: ItemId;
	items: SvelteMap<ItemId, FileTreeItemData>;
	parentMap: SvelteMap<ItemId, ItemId>;
	expandedIds?: SvelteSet<ItemId>;
	selectedId?: ItemId;
	depth?: number;
	draggable?: boolean;
	onSelect?: (itemId: ItemId) => void;
	onToggle?: (itemId: ItemId) => void;
	onDragStart?: (itemId: ItemId, event: DragEvent) => void;
	onDrop?: (targetId: ItemId, dragData: FileTreeDragData) => void;
}

let {
	itemId,
	items,
	parentMap,
	expandedIds,
	selectedId,
	depth = 0,
	draggable = false,
	onSelect,
	onToggle,
	onDragStart,
	onDrop,
}: Props = $props();

const item = $derived(items.get(itemId) ?? FILETREE_NOTFOUND_ITEM);
const isFolder = $derived(item.type === FileTreeItemType.Folder);
const isExpanded = $derived(expandedIds?.has(itemId) ?? false);
const isSelected = $derived(selectedId === itemId);

const childIds = $derived.by(() => {
	const ids: string[] = [];
	for (const [childId, pId] of parentMap.entries()) {
		if (pId === itemId) {
			ids.push(childId);
		}
	}
	return ids.sort((a, b) => {
		const itemA = items.get(a);
		const itemB = items.get(b);
		if (!(itemA && itemB)) return 0;
		if (itemA.type !== itemB.type) {
			return itemA.type === FileTreeItemType.Folder ? -1 : 1;
		}
		return itemA.name.localeCompare(itemB.name);
	});
});

const hasChildren = $derived(childIds.length > 0);

function handleClick() {
	onSelect?.(itemId);
}

function handleToggle() {
	if (isFolder) {
		onToggle?.(itemId);
	}
}

function handleDragStart(event: DragEvent) {
	if (!(draggable && event.dataTransfer)) return;

	const dragData: FileTreeDragData = {
		id: item.id,
		name: item.name,
		type: item.type,
	};

	event.dataTransfer.setData("application/json", JSON.stringify(dragData));
	event.dataTransfer.effectAllowed = "move";
	onDragStart?.(itemId, event);
}

function handleDrop(event: DragEvent) {
	if (!(isFolder && event.dataTransfer)) return;

	const jsonData = event.dataTransfer.getData("application/json");
	if (!jsonData) return;

	try {
		const dragData = JSON.parse(jsonData) as FileTreeDragData;
		if (dragData.id === itemId) return;
		onDrop?.(itemId, dragData);
	} catch {
		// Invalid JSON, ignore
	}
}
</script>

<div class="tree-node">
	<FileTreeItem
		name={item.name}
		type={item.type}
		status={item.status}
		meta={item.meta}
		{depth}
		{isExpanded}
		{isSelected}
		isLoading={item.isLoading}
		{hasChildren}
		{draggable}
		onclick={handleClick}
		onToggle={handleToggle}
		ondragstart={handleDragStart}
		ondrop={handleDrop}
	/>

	{#if isFolder && isExpanded && hasChildren}
		<div class="ml-3 border-l border-border-default pl-1">
			{#each childIds as childId (childId)}
				<Self
					itemId={childId}
					{items}
					{parentMap}
					{expandedIds}
					{selectedId}
					depth={depth + 1}
					{draggable}
					{onSelect}
					{onToggle}
					{onDragStart}
					{onDrop}
				/>
			{/each}
		</div>
	{/if}
</div>
