<!--
@component
name: LayoutContainerTabsContextMenu
type: stupid
styleguide: 1.0.0
description: Context menu for tab actions like rename and close
usage: Render when user right-clicks on a tab in the layout
-->
<script lang="ts">
import ContextMenu from "$lib/common/contextMenu/ContextMenu.component.svelte";
import {
	ContextMenuItemType,
	type ContextMenuItem,
	type ContextMenuPosition,
} from "$lib/common/contextMenu/contextMenu.lib";
import { TabActionId } from "./layoutContainerTabsContextMenu.lib";

interface Props {
	position: ContextMenuPosition;
	itemType?: string;
	onRename?: () => void;
	onChangeUrl?: () => void;
	onClose?: () => void;
	onMenuClose?: () => void;
}

let { position, itemType, onRename, onChangeUrl, onClose, onMenuClose }: Props = $props();

const menuItems = $derived.by(() => {
	const items: ContextMenuItem<TabActionId>[] = [
		{
			id: TabActionId.Rename,
			label: "Rename",
			type: ContextMenuItemType.Action,
		},
	];

	if (itemType === "iframe") {
		items.push({
			id: TabActionId.ChangeUrl,
			label: "Change URL",
			type: ContextMenuItemType.Action,
		});
	}

	items.push(
		{
			type: ContextMenuItemType.Divider,
		},
		{
			danger: true,
			id: TabActionId.Close,
			label: "Close",
			type: ContextMenuItemType.Action,
		},
	);

	return items;
});

function handleAction(actionId: TabActionId) {
	switch (actionId) {
		case TabActionId.Rename:
			onRename?.();
			break;
		case TabActionId.ChangeUrl:
			onChangeUrl?.();
			break;
		case TabActionId.Close:
			onClose?.();
			break;
	}
}
</script>

<ContextMenu items={menuItems} {position} onAction={handleAction} onClose={onMenuClose} />
