import type { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { svelte } from "@replit/codemirror-lang-svelte";

export enum EditorConnectionStatus {
	Disconnected = "disconnected",
	Connecting = "connecting",
	Connected = "connected",
	Error = "error",
}

export enum EditorLanguageId {
	TypeScript = "typescript",
	JavaScript = "javascript",
	Svelte = "svelte",
	CSS = "css",
	HTML = "html",
	JSON = "json",
	Markdown = "markdown",
	Unknown = "unknown",
}

export function editorLanguageIdFromPath(filePath: string): EditorLanguageId {
	const ext = filePath.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "ts":
		case "tsx":
			return EditorLanguageId.TypeScript;
		case "js":
		case "jsx":
		case "mjs":
		case "cjs":
			return EditorLanguageId.JavaScript;
		case "svelte":
			return EditorLanguageId.Svelte;
		case "css":
		case "scss":
		case "less":
			return EditorLanguageId.CSS;
		case "html":
		case "htm":
			return EditorLanguageId.HTML;
		case "json":
			return EditorLanguageId.JSON;
		case "md":
		case "markdown":
			return EditorLanguageId.Markdown;
		default:
			return EditorLanguageId.Unknown;
	}
}

export function editorLanguageExtensionGet(languageId: EditorLanguageId): Extension {
	switch (languageId) {
		case EditorLanguageId.TypeScript:
			return javascript({ typescript: true, jsx: true });
		case EditorLanguageId.JavaScript:
			return javascript({ jsx: true });
		case EditorLanguageId.Svelte:
			return svelte();
		case EditorLanguageId.CSS:
			return css();
		case EditorLanguageId.HTML:
			return html();
		case EditorLanguageId.JSON:
			return json();
		case EditorLanguageId.Markdown:
			return markdown();
		default:
			return [];
	}
}

export const editorThemeCrt = {
	"&": {
		backgroundColor: "#0a0a0a",
		color: "#e0e0e0",
	},
	".cm-content": {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: "13px",
		lineHeight: "1.5",
		caretColor: "#00ff41",
	},
	".cm-cursor": {
		borderLeftColor: "#00ff41",
		borderLeftWidth: "2px",
	},
	".cm-activeLine": {
		backgroundColor: "rgba(0, 255, 65, 0.05)",
	},
	".cm-activeLineGutter": {
		backgroundColor: "rgba(0, 255, 65, 0.05)",
	},
	".cm-gutters": {
		backgroundColor: "#0a0a0a",
		color: "#555555",
		border: "none",
		borderRight: "1px solid #222222",
	},
	".cm-lineNumbers .cm-gutterElement": {
		padding: "0 8px 0 4px",
	},
	".cm-selectionBackground, .cm-content ::selection": {
		backgroundColor: "rgba(0, 255, 65, 0.2) !important",
	},
	".cm-focused .cm-selectionBackground": {
		backgroundColor: "rgba(0, 255, 65, 0.3) !important",
	},
	".cm-matchingBracket": {
		backgroundColor: "rgba(0, 255, 65, 0.3)",
		color: "#00ff41 !important",
	},
	".cm-searchMatch": {
		backgroundColor: "rgba(255, 176, 0, 0.3)",
	},
	".cm-searchMatch.cm-searchMatch-selected": {
		backgroundColor: "rgba(255, 176, 0, 0.5)",
	},
};
