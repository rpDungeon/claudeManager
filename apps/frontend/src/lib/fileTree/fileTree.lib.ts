import type { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import { IndicatorDotColor as Colors } from "$lib/common/indicatorDot.lib";

export enum FileTreeItemType {
	File = "file",
	Folder = "folder",
}

export enum FileStatus {
	Clean = "clean",
	Conflicted = "conflicted",
	Ignored = "ignored",
	Modified = "modified",
	Staged = "staged",
	Untracked = "untracked",
}

export const fileStatusColorMap: Record<FileStatus, IndicatorDotColor> = {
	[FileStatus.Clean]: Colors.Gray,
	[FileStatus.Conflicted]: Colors.Red,
	[FileStatus.Ignored]: Colors.Gray,
	[FileStatus.Modified]: Colors.Amber,
	[FileStatus.Staged]: Colors.Green,
	[FileStatus.Untracked]: Colors.Cyan,
};

export interface FileTreeItemData {
	id: string;
	isLoading?: boolean;
	meta?: string;
	name: string;
	status?: FileStatus;
	type: FileTreeItemType;
}

export const FILETREE_NOTFOUND_ITEM: FileTreeItemData = {
	id: "__notfound__",
	name: "[Not Found]",
	status: FileStatus.Ignored,
	type: FileTreeItemType.File,
};

export interface FileTreeDragData {
	id: string;
	name: string;
	type: FileTreeItemType;
}
