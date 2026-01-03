import themeData from "./symbol-icon-theme.json" with { type: "json" };

interface IconDefinition {
	iconPath: string;
}

interface IconTheme {
	iconDefinitions: Record<string, IconDefinition>;
	file: string;
	folder: string;
	fileNames: Record<string, string>;
	fileExtensions: Record<string, string>;
	folderNames: Record<string, string>;
	languageIds: Record<string, string>;
}

const theme = themeData as IconTheme;

export function fileIconResolve(filename: string, isFolder: boolean): string {
	const lowerName = filename.toLowerCase();

	if (isFolder) {
		if (theme.folderNames[lowerName]) {
			return theme.folderNames[lowerName];
		}
		return theme.folder;
	}

	if (theme.fileNames[lowerName]) {
		return theme.fileNames[lowerName];
	}
	if (theme.fileNames[filename]) {
		return theme.fileNames[filename];
	}

	const extensions = fileExtensionsExtract(filename);
	for (const ext of extensions) {
		if (theme.fileExtensions[ext]) {
			return theme.fileExtensions[ext];
		}
	}

	return theme.file;
}

function fileExtensionsExtract(filename: string): string[] {
	const parts = filename.split(".");
	if (parts.length <= 1) return [];

	const extensions: string[] = [];
	for (let i = 1; i < parts.length; i++) {
		extensions.push(parts.slice(i).join(".").toLowerCase());
	}
	return extensions;
}

export function fileIconPathGet(iconId: string, isFolder: boolean): string {
	const def = theme.iconDefinitions[iconId];
	if (!def) {
		const fallbackId = isFolder ? theme.folder : theme.file;
		const fallbackDef = theme.iconDefinitions[fallbackId];
		return fallbackDef?.iconPath.replace("./icons/", "/icons/symbols/") ?? "/icons/symbols/files/document.svg";
	}
	return def.iconPath.replace("./icons/", "/icons/symbols/");
}
