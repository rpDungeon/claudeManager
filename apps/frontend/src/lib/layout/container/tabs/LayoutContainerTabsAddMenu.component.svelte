<!--
@component
name: LayoutContainerTabsAddMenu
type: stupid
styleguide: 1.0.0
description: Dropdown menu for adding new items to a tab container
usage: Render when user clicks the + button in the tab bar
-->
<script lang="ts">
import ContextMenu from "$lib/common/contextMenu/ContextMenu.component.svelte";
import {
	ContextMenuItemType,
	type ContextMenuItem,
	type ContextMenuPosition,
} from "$lib/common/contextMenu/contextMenu.lib";
import { AddItemType } from "./layoutContainerTabsAddMenu.lib";

interface Props {
	position: ContextMenuPosition;
	onAddItem?: (itemType: AddItemType) => void;
	onMenuClose?: () => void;
}

let { position, onAddItem, onMenuClose }: Props = $props();

const menuItems: ContextMenuItem<AddItemType>[] = [
	{
		id: AddItemType.Terminal,
		label: "Terminal",
		type: ContextMenuItemType.Action,
	},
	{
		id: AddItemType.Editor,
		label: "Editor",
		type: ContextMenuItemType.Action,
	},
	{
		id: AddItemType.Iframe,
		label: "Iframe",
		type: ContextMenuItemType.Action,
	},
];

function handleAction(id: AddItemType) {
	onAddItem?.(id);
	onMenuClose?.();
}
</script>

<ContextMenu items={menuItems} {position} onAction={handleAction} onClose={onMenuClose} />
