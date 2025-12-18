export enum ContextMenuItemType {
	Action = "action",
	Divider = "divider",
	Toggle = "toggle",
}

export interface ContextMenuActionItem {
	type: ContextMenuItemType.Action;
	id: string;
	label: string;
	shortcut?: string;
	disabled?: boolean;
	danger?: boolean;
}

export interface ContextMenuDividerItem {
	type: ContextMenuItemType.Divider;
}

export interface ContextMenuToggleItem {
	type: ContextMenuItemType.Toggle;
	id: string;
	label: string;
	checked: boolean;
	disabled?: boolean;
}

export type ContextMenuItem = ContextMenuActionItem | ContextMenuDividerItem | ContextMenuToggleItem;

export interface ContextMenuPosition {
	x: number;
	y: number;
}
