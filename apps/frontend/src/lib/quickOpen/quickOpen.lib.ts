import type { FsFileListItem } from "@claude-manager/common/src/fs/fs.types";
import fuzzysort from "fuzzysort";

export enum QuickOpenMode {
	File = "file",
	Line = "line",
	Symbol = "symbol",
	Project = "project",
}

export type QuickOpenResult = {
	filePath?: string;
	icon?: string;
	id: string;
	layoutId?: string | null;
	line?: number;
	primary: string;
	score?: number;
	secondary?: string;
	type: QuickOpenMode;
};

export function quickOpenModeDetect(query: string): {
	cleanQuery: string;
	mode: QuickOpenMode;
} {
	if (query.startsWith(":")) {
		return {
			cleanQuery: query.slice(1),
			mode: QuickOpenMode.Line,
		};
	}
	if (query.startsWith("@")) {
		return {
			cleanQuery: query.slice(1),
			mode: QuickOpenMode.Symbol,
		};
	}
	if (query.startsWith("#")) {
		return {
			cleanQuery: query.slice(1),
			mode: QuickOpenMode.Project,
		};
	}
	return {
		cleanQuery: query,
		mode: QuickOpenMode.File,
	};
}

export function quickOpenFuzzySearchFiles(query: string, files: FsFileListItem[], limit = 50): QuickOpenResult[] {
	if (!query.trim()) {
		return files.slice(0, limit).map((file) => ({
			id: file.path,
			primary: file.name,
			secondary: file.relativePath,
			type: QuickOpenMode.File,
		}));
	}

	const results = fuzzysort.go(query, files, {
		key: "relativePath",
		limit,
		threshold: 0.2,
	});

	return results.map((result) => ({
		id: result.obj.path,
		primary: result.obj.name,
		score: result.score,
		secondary: result.obj.relativePath,
		type: QuickOpenMode.File,
	}));
}

export function quickOpenParseLineNumber(query: string): number | null {
	const trimmed = query.trim();
	if (!trimmed) return null;

	const num = Number.parseInt(trimmed, 10);
	if (Number.isNaN(num) || num < 1) return null;

	return num;
}

export const quickOpenModeConfig: Record<
	QuickOpenMode,
	{
		emptyMessage: string;
		placeholder: string;
		prefix: string;
	}
> = {
	[QuickOpenMode.File]: {
		emptyMessage: "No files found",
		placeholder: "Search files by name...",
		prefix: "",
	},
	[QuickOpenMode.Line]: {
		emptyMessage: "Enter a line number",
		placeholder: "Go to line...",
		prefix: ":",
	},
	[QuickOpenMode.Symbol]: {
		emptyMessage: "No symbols found in current file",
		placeholder: "Go to symbol in file...",
		prefix: "@",
	},
	[QuickOpenMode.Project]: {
		emptyMessage: "No projects found",
		placeholder: "Switch to project...",
		prefix: "#",
	},
};
