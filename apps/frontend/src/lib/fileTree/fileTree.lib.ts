// Review pending by Autumnlight
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

export enum FileTreeItemType {
	Error = "error",
	File = "file",
	Folder = "folder",
}

export enum FileStatus {
	Clean = "clean",
	Conflicted = "conflicted",
	Error = "error",
	Ignored = "ignored",
	Modified = "modified",
	Staged = "staged",
	Untracked = "untracked",
}

export const fileStatusColorMap: Record<FileStatus, IndicatorDotColor> = {
	[FileStatus.Clean]: IndicatorDotColor.Gray,
	[FileStatus.Conflicted]: IndicatorDotColor.Red,
	[FileStatus.Error]: IndicatorDotColor.Red,
	[FileStatus.Ignored]: IndicatorDotColor.Gray,
	[FileStatus.Modified]: IndicatorDotColor.Amber,
	[FileStatus.Staged]: IndicatorDotColor.Green,
	[FileStatus.Untracked]: IndicatorDotColor.Cyan,
};

export interface FileTreeItemData {
	errorMessage?: string;
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
	id: FileTreeItemData["id"];
	name: FileTreeItemData["name"];
	type: FileTreeItemData["type"];
}
