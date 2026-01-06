import type { FsFileListItem } from "@claude-manager/common/src/fs/fs.types";
import type { Project } from "@claude-manager/common/src/project/project.types";
import { SvelteMap } from "svelte/reactivity";
import type { DocumentSymbol, SymbolInformation } from "vscode-languageserver-protocol";
import { api } from "$lib/api/api.client";
import { editorInstanceGet } from "$lib/editor/editor.service.svelte";
import { QuickOpenMode, type QuickOpenResult } from "./quickOpen.lib";

type ProjectCache = {
	projects: Project[];
	loadedAt: number;
};

const PROJECT_CACHE_TTL_MS = 60_000;
let projectCache: ProjectCache | null = null;

export async function quickOpenProjectsLoad(): Promise<QuickOpenResult[]> {
	const now = Date.now();

	if (projectCache && now - projectCache.loadedAt < PROJECT_CACHE_TTL_MS) {
		return projectCache.projects.map(projectToResult);
	}

	const response = await api.projects.get();

	if (response.error || !response.data) {
		return projectCache?.projects.map(projectToResult) ?? [];
	}

	projectCache = {
		loadedAt: now,
		projects: response.data,
	};

	return response.data.map(projectToResult);
}

function projectToResult(project: Project): QuickOpenResult {
	return {
		id: project.id,
		layoutId: project.layoutId,
		primary: project.name,
		secondary: project.path,
		type: QuickOpenMode.Project,
	};
}

export function quickOpenProjectsCacheClear(): void {
	projectCache = null;
}

type FileIndexCache = {
	files: FsFileListItem[];
	loadedAt: number;
};

const FILE_INDEX_CACHE_TTL_MS = 30_000;

const fileIndexCache = new SvelteMap<string, FileIndexCache>();

export async function quickOpenFileIndexLoad(projectPath: string): Promise<FsFileListItem[]> {
	const cached = fileIndexCache.get(projectPath);
	const now = Date.now();

	if (cached && now - cached.loadedAt < FILE_INDEX_CACHE_TTL_MS) {
		return cached.files;
	}

	const response = await api.fs["list-recursive"].get({
		query: {
			path: projectPath,
		},
	});

	if (response.error || !response.data) {
		return cached?.files ?? [];
	}

	const files = response.data;

	fileIndexCache.set(projectPath, {
		files,
		loadedAt: now,
	});

	return files;
}

export function quickOpenFileIndexClear(projectPath?: string): void {
	if (projectPath) {
		fileIndexCache.delete(projectPath);
	} else {
		fileIndexCache.clear();
	}
}

const SYMBOL_KIND_NAMES: Record<number, string> = {
	1: "File",
	2: "Module",
	3: "Namespace",
	4: "Package",
	5: "Class",
	6: "Method",
	7: "Property",
	8: "Field",
	9: "Constructor",
	10: "Enum",
	11: "Interface",
	12: "Function",
	13: "Variable",
	14: "Constant",
	15: "String",
	16: "Number",
	17: "Boolean",
	18: "Array",
	19: "Object",
	20: "Key",
	21: "Null",
	22: "EnumMember",
	23: "Struct",
	24: "Event",
	25: "Operator",
	26: "TypeParameter",
};

function symbolKindToName(kind: number): string {
	return SYMBOL_KIND_NAMES[kind] ?? "Symbol";
}

function isDocumentSymbol(symbol: DocumentSymbol | SymbolInformation): symbol is DocumentSymbol {
	return "children" in symbol || ("range" in symbol && !("location" in symbol));
}

function flattenDocumentSymbols(
	symbols: (DocumentSymbol | SymbolInformation)[],
	filePath: string,
	parentName?: string,
): QuickOpenResult[] {
	const results: QuickOpenResult[] = [];

	for (const symbol of symbols) {
		if (isDocumentSymbol(symbol)) {
			const fullName = parentName ? `${parentName}.${symbol.name}` : symbol.name;
			results.push({
				id: `${filePath}:${symbol.range.start.line}:${symbol.name}`,
				line: symbol.range.start.line + 1,
				primary: symbol.name,
				secondary: symbolKindToName(symbol.kind),
				type: QuickOpenMode.Symbol,
			});
			if (symbol.children) {
				results.push(...flattenDocumentSymbols(symbol.children, filePath, fullName));
			}
		} else {
			results.push({
				id: `${symbol.location.uri}:${symbol.location.range.start.line}:${symbol.name}`,
				line: symbol.location.range.start.line + 1,
				primary: symbol.name,
				secondary: symbolKindToName(symbol.kind),
				type: QuickOpenMode.Symbol,
			});
		}
	}

	return results;
}

export async function quickOpenDocumentSymbolsGet(editorId: string): Promise<QuickOpenResult[]> {
	const instance = editorInstanceGet(editorId);
	if (!(instance?.lspClient && instance.lspConnected)) {
		return [];
	}

	const fileUri = `file://${instance.filePath}`;

	try {
		instance.lspClient.sync();

		const symbols = await instance.lspClient.request<
			{
				textDocument: {
					uri: string;
				};
			},
			(DocumentSymbol | SymbolInformation)[] | null
		>("textDocument/documentSymbol", {
			textDocument: {
				uri: fileUri,
			},
		});

		if (!symbols) {
			return [];
		}

		return flattenDocumentSymbols(symbols, instance.filePath);
	} catch (err) {
		console.error("[QuickOpen] Failed to fetch document symbols:", err);
		return [];
	}
}
