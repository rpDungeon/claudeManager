export enum TargetType {
	File = "file",
	Folder = "folder",
}

export enum FileActionId {
	OpenToSide = "open-to-side",
	CopyPath = "copy-path",
	CopyRelativePath = "copy-relative-path",
	Rename = "rename",
	Delete = "delete",
}

export enum FolderActionId {
	NewFile = "new-file",
	NewFolder = "new-folder",
	Rename = "rename",
	Delete = "delete",
}

export type ActionId = FileActionId | FolderActionId;
