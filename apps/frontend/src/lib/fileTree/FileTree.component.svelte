<!--
@component
name: FileTree
type: smart
styleguide: 1.0.0
description: File tree container managing selection, expansion, and drag-drop operations
usage: Pass items map, parentMap, and rootId to render a complete file tree with event handlers
-->
<script lang="ts">
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import FileTreeNode from "./node/FileTreeNode.component.svelte";
import type { FileTreeItemData, FileTreeDragData } from "./fileTree.lib";

type ItemId = FileTreeItemData["id"];

interface Props {
	items: SvelteMap<ItemId, FileTreeItemData>;
	parentMap: SvelteMap<ItemId, ItemId>;
	rootId: ItemId;
	selectedId?: ItemId;
	expandedIds?: SvelteSet<ItemId>;
	draggable?: boolean;
	onSelect?: (itemId: ItemId) => void;
	onToggle?: (itemId: ItemId) => void;
	onNodeMove?: (sourceId: ItemId, targetId: ItemId) => void;
	onDoubleClick?: (itemId: ItemId) => void;
	onContextMenu?: (itemId: ItemId, event: MouseEvent) => void;
}

let {
	items,
	parentMap,
	rootId,
	selectedId = $bindable(),
	expandedIds = new SvelteSet<string>(),
	draggable = false,
	onSelect,
	onToggle,
	onNodeMove,
	onDoubleClick,
	onContextMenu,
}: Props = $props();

function handleSelect(itemId: ItemId) {
	selectedId = itemId;
	onSelect?.(itemId);
}

function handleToggle(itemId: ItemId) {
	if (onToggle) {
		onToggle(itemId);
	} else {
		if (expandedIds.has(itemId)) {
			expandedIds.delete(itemId);
		} else {
			expandedIds.add(itemId);
		}
	}
}

function handleDragStart(_itemId: ItemId, _event: DragEvent) {
	// Drag data is set in FileTreeNode
}

function handleDrop(targetId: ItemId, dragData: FileTreeDragData) {
	if (dragData.id === targetId) return;

	const currentParent = parentMap.get(dragData.id);
	if (currentParent === targetId) return;

	onNodeMove?.(dragData.id, targetId);
}

function handleKeyDown(event: KeyboardEvent) {
	if (!selectedId) return;

	const item = items.get(selectedId);
	if (!item) return;

	if (event.key === "Enter") {
		onDoubleClick?.(selectedId);
	}
}
</script>

<div
	class="file-tree h-full overflow-auto text-[11px]"
	role="tree"
	tabindex="0"
	onkeydown={handleKeyDown}
	oncontextmenu={(e) => {
		if (selectedId) {
			e.preventDefault();
			onContextMenu?.(selectedId, e);
		}
	}}
>
	<FileTreeNode
		itemId={rootId}
		{items}
		{parentMap}
		{expandedIds}
		{selectedId}
		{draggable}
		onSelect={handleSelect}
		onToggle={handleToggle}
		onDragStart={handleDragStart}
		onDrop={handleDrop}
		{onContextMenu}
	/>
</div>
