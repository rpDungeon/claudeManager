export enum ContextMenuItemType {
	Action = "action",
	Divider = "divider",
	Toggle = "toggle",
}

export interface ContextMenuActionItem<TId extends string = string> {
	type: ContextMenuItemType.Action;
	id: TId;
	label: string;
	shortcut?: string;
	disabled?: boolean;
	danger?: boolean;
}

export interface ContextMenuDividerItem {
	type: ContextMenuItemType.Divider;
}

export interface ContextMenuToggleItem<TId extends string = string> {
	type: ContextMenuItemType.Toggle;
	id: TId;
	label: string;
	checked: boolean;
	disabled?: boolean;
}

export type ContextMenuItem<TId extends string = string> =
	| ContextMenuActionItem<TId>
	| ContextMenuDividerItem
	| ContextMenuToggleItem<TId>;

export interface ContextMenuPosition {
	x: number;
	y: number;
}
