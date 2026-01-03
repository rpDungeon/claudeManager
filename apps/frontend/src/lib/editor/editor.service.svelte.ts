import { EditorView, basicSetup } from "codemirror";
import { EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { LSPClient, languageServerExtensions } from "@codemirror/lsp-client";
import { SvelteMap } from "svelte/reactivity";
import { api } from "$lib/api/api.client";
import {
	EditorConnectionStatus,
	EditorLanguageId,
	editorLanguageExtensionGet,
	editorLanguageIdFromPath,
	editorThemeCrt,
} from "./editor.lib";
import { editorLspTransportCreate, editorLanguageIdToLspLanguageId } from "./lsp/lspTransport";

type EditorId = string;

type EditorInstance = {
	container: HTMLElement | null;
	connectionStatus: EditorConnectionStatus;
	filePath: string;
	content: string;
	isDirty: boolean;
	isLoading: boolean;
	error: string | null;
	view: EditorView | null;
	lspClient: LSPClient | null;
	lspConnected: boolean;
};

const instances = new SvelteMap<EditorId, EditorInstance>();

export function editorInstanceGet(editorId: EditorId): EditorInstance | undefined {
	return instances.get(editorId);
}

export function editorInstanceCreate(editorId: EditorId, filePath: string): EditorInstance {
	const existing = instances.get(editorId);
	if (existing) return existing;

	const instance: EditorInstance = $state({
		container: null,
		connectionStatus: EditorConnectionStatus.Disconnected,
		filePath,
		content: "",
		isDirty: false,
		isLoading: false,
		error: null,
		view: null,
		lspClient: null,
		lspConnected: false,
	});

	instances.set(editorId, instance);
	return instance;
}

export function editorInstanceDestroy(editorId: EditorId): void {
	const instance = instances.get(editorId);
	if (!instance) return;

	if (instance.view) {
		instance.view.destroy();
	}

	instances.delete(editorId);
}

export function editorInstanceMount(editorId: EditorId, container: HTMLElement): void {
	const instance = instances.get(editorId);
	if (!instance) return;

	if (instance.container === container && instance.view) return;

	instance.container = container;

	const languageId = editorLanguageIdFromPath(instance.filePath);
	const languageExtension = editorLanguageExtensionGet(languageId);

	const extensions: Extension[] = [
		basicSetup,
		languageExtension,
		oneDark,
		EditorView.theme(editorThemeCrt),
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				const newContent = update.state.doc.toString();
				if (newContent !== instance.content) {
					instance.isDirty = true;
				}
			}
		}),
		EditorView.lineWrapping,
	];

	const state = EditorState.create({
		doc: instance.content,
		extensions,
	});

	if (instance.view) {
		instance.view.destroy();
	}

	instance.view = new EditorView({
		state,
		parent: container,
	});
}

export async function editorLspConnect(editorId: EditorId, rootUri: string): Promise<void> {
	const instance = instances.get(editorId);
	if (!instance?.view || instance.lspConnected) return;

	const languageId = editorLanguageIdFromPath(instance.filePath);
	const lspLanguageId = editorLanguageIdToLspLanguageId(languageId);

	if (!lspLanguageId) {
		console.log(`[Editor] No LSP support for language: ${languageId}`);
		return;
	}

	try {
		const sessionId = `${editorId}-${Date.now()}`;
		const transport = await editorLspTransportCreate({
			rootUri,
			languageId: lspLanguageId,
			sessionId,
		});

		const client = new LSPClient({
			extensions: languageServerExtensions(),
		}).connect(transport);

		instance.lspClient = client;
		instance.lspConnected = true;

		const fileUri = `file://${instance.filePath}`;
		const lspExtension = client.plugin(fileUri);

		const currentDoc = instance.view.state.doc.toString();
		const languageExtension = editorLanguageExtensionGet(languageId);

		const newState = EditorState.create({
			doc: currentDoc,
			extensions: [
				basicSetup,
				languageExtension,
				oneDark,
				EditorView.theme(editorThemeCrt),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const newContent = update.state.doc.toString();
						if (newContent !== instance.content) {
							instance.isDirty = true;
						}
					}
				}),
				EditorView.lineWrapping,
				lspExtension,
			],
		});

		instance.view.setState(newState);

		console.log(`[Editor] LSP connected for ${instance.filePath}`);
	} catch (err) {
		console.error("[Editor] Failed to connect LSP:", err);
	}
}

export async function editorFileLoad(editorId: EditorId): Promise<void> {
	const instance = instances.get(editorId);
	if (!instance) return;

	instance.isLoading = true;
	instance.error = null;

	try {
		const { data, error } = await api.fs.read.get({
			query: {
				path: instance.filePath,
			},
		});

		if (error || !data) {
			instance.error = "Failed to load file";
			return;
		}

		if (data.type !== "file" || !("content" in data)) {
			instance.error = "Path is not a file";
			return;
		}

		const content = atob(data.content);
		instance.content = content;
		instance.isDirty = false;
		instance.connectionStatus = EditorConnectionStatus.Connected;

		if (instance.view) {
			instance.view.dispatch({
				changes: {
					from: 0,
					to: instance.view.state.doc.length,
					insert: content,
				},
			});
		}
	} catch (err) {
		instance.error = err instanceof Error ? err.message : "Unknown error loading file";
		instance.connectionStatus = EditorConnectionStatus.Error;
	} finally {
		instance.isLoading = false;
	}
}

export async function editorFileSave(editorId: EditorId): Promise<boolean> {
	const instance = instances.get(editorId);
	if (!instance?.view) return false;

	const content = instance.view.state.doc.toString();

	try {
		const { error } = await api.fs.file.put({
			content,
			path: instance.filePath,
		});

		if (error) {
			instance.error = "Failed to save file";
			return false;
		}

		instance.content = content;
		instance.isDirty = false;
		return true;
	} catch (err) {
		instance.error = err instanceof Error ? err.message : "Unknown error saving file";
		return false;
	}
}

export function editorInstanceFocus(editorId: EditorId): void {
	const instance = instances.get(editorId);
	if (!instance?.view) return;

	instance.view.focus();
}

export function editorInstanceGetContent(editorId: EditorId): string | null {
	const instance = instances.get(editorId);
	if (!instance?.view) return null;

	return instance.view.state.doc.toString();
}

export type { EditorInstance };
