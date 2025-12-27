<!--
@component
name: DashboardFileExplorerContextMenu
type: stupid
styleguide: 1.0.0
description: Context menu for file explorer with file and folder actions
usage: Render when user right-clicks on a file or folder in the explorer
-->
<script lang="ts">
import ContextMenu from "$lib/common/contextMenu/ContextMenu.component.svelte";
import {
	ContextMenuItemType,
	type ContextMenuItem,
	type ContextMenuPosition,
} from "$lib/common/contextMenu/contextMenu.lib";
import { FileActionId, FolderActionId, TargetType, type ActionId } from "./dashboardFileExplorerContextMenu.lib";

interface Props {
	targetType: TargetType;
	position: ContextMenuPosition;
	onOpenToSide?: () => void;
	onCopyPath?: () => void;
	onCopyRelativePath?: () => void;
	onNewFile?: () => void;
	onNewFolder?: () => void;
	onRename?: () => void;
	onDelete?: () => void;
	onClose?: () => void;
}

let {
	targetType,
	position,
	onOpenToSide,
	onCopyPath,
	onCopyRelativePath,
	onNewFile,
	onNewFolder,
	onRename,
	onDelete,
	onClose,
}: Props = $props();

const fileMenuItems: ContextMenuItem<FileActionId>[] = [
	{
		id: FileActionId.OpenToSide,
		label: "Open to the Side",
		type: ContextMenuItemType.Action,
	},
	{
		type: ContextMenuItemType.Divider,
	},
	{
		id: FileActionId.CopyPath,
		label: "Copy Path",
		type: ContextMenuItemType.Action,
	},
	{
		id: FileActionId.CopyRelativePath,
		label: "Copy Relative Path",
		type: ContextMenuItemType.Action,
	},
	{
		type: ContextMenuItemType.Divider,
	},
	{
		id: FileActionId.Rename,
		label: "Rename",
		type: ContextMenuItemType.Action,
	},
	{
		danger: true,
		id: FileActionId.Delete,
		label: "Delete",
		type: ContextMenuItemType.Action,
	},
];

const folderMenuItems: ContextMenuItem<FolderActionId>[] = [
	{
		id: FolderActionId.NewFile,
		label: "New File",
		type: ContextMenuItemType.Action,
	},
	{
		id: FolderActionId.NewFolder,
		label: "New Folder",
		type: ContextMenuItemType.Action,
	},
	{
		type: ContextMenuItemType.Divider,
	},
	{
		id: FolderActionId.Rename,
		label: "Rename",
		type: ContextMenuItemType.Action,
	},
	{
		danger: true,
		id: FolderActionId.Delete,
		label: "Delete",
		type: ContextMenuItemType.Action,
	},
];

const menuItems = $derived<ContextMenuItem<ActionId>[]>(
	targetType === TargetType.File ? fileMenuItems : folderMenuItems,
);

function handleAction(actionId: ActionId) {
	switch (actionId) {
		case FileActionId.OpenToSide:
			onOpenToSide?.();
			break;
		case FileActionId.CopyPath:
			onCopyPath?.();
			break;
		case FileActionId.CopyRelativePath:
			onCopyRelativePath?.();
			break;
		case FolderActionId.NewFile:
			onNewFile?.();
			break;
		case FolderActionId.NewFolder:
			onNewFolder?.();
			break;
		case FileActionId.Rename:
		case FolderActionId.Rename:
			onRename?.();
			break;
		case FileActionId.Delete:
		case FolderActionId.Delete:
			onDelete?.();
			break;
	}
}
</script>

<ContextMenu items={menuItems} {position} onAction={handleAction} {onClose} />
