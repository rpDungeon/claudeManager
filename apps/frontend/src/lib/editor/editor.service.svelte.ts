import { lintGutter } from "@codemirror/lint";
import { LSPClient, languageServerExtensions } from "@codemirror/lsp-client";
import { EditorState, type Extension } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { SvelteMap } from "svelte/reactivity";
import { api } from "$lib/api/api.client";
import { settingsEditorFontSizeGet } from "$lib/settings/settings.service.svelte";
import {
	EditorConnectionStatus,
	editorLanguageExtensionGet,
	editorLanguageIdFromPath,
	editorThemeTomorrowNightBright,
} from "./editor.lib";
import { editorLanguageIdToLspLanguageId, editorLspTransportCreate } from "./lsp/lspTransport";

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
		connectionStatus: EditorConnectionStatus.Disconnected,
		container: null,
		content: "",
		error: null,
		filePath,
		isDirty: false,
		isLoading: false,
		lspClient: null,
		lspConnected: false,
		view: null,
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

	const fontSize = settingsEditorFontSizeGet();
	const extensions: Extension[] = [
		basicSetup,
		languageExtension,
		editorThemeTomorrowNightBright,
		lintGutter(),
		EditorView.theme({
			".cm-content": {
				fontSize: `${fontSize}px`,
			},
			".cm-gutters": {
				fontSize: `${fontSize}px`,
			},
		}),
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
		parent: container,
		state,
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
			languageId: lspLanguageId,
			rootUri,
			sessionId,
		});

		const client = new LSPClient({
			extensions: languageServerExtensions(),
			rootUri,
			timeout: 10_000,
		}).connect(transport);

		instance.lspClient = client;
		instance.lspConnected = true;

		const fileUri = `file://${instance.filePath}`;
		const lspExtension = client.plugin(fileUri);

		const currentDoc = instance.view.state.doc.toString();
		const languageExtension = editorLanguageExtensionGet(languageId);
		const fontSize = settingsEditorFontSizeGet();

		const newState = EditorState.create({
			doc: currentDoc,
			extensions: [
				basicSetup,
				languageExtension,
				editorThemeTomorrowNightBright,
				lintGutter(),
				EditorView.theme({
					".cm-content": {
						fontSize: `${fontSize}px`,
					},
					".cm-gutters": {
						fontSize: `${fontSize}px`,
					},
				}),
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

		const bytes = Uint8Array.from(atob(data.content), (c) => c.charCodeAt(0));
		const content = new TextDecoder().decode(bytes);
		instance.content = content;
		instance.isDirty = false;
		instance.connectionStatus = EditorConnectionStatus.Connected;

		if (instance.view) {
			instance.view.dispatch({
				changes: {
					from: 0,
					insert: content,
					to: instance.view.state.doc.length,
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
	const bytes = new TextEncoder().encode(content);
	const contentBase64 = btoa(String.fromCharCode(...bytes));

	try {
		const { error } = await api.fs.file.put({
			content: contentBase64,
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
