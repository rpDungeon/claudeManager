import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";
import { svelte } from "@replit/codemirror-lang-svelte";
import { createTheme } from "@uiw/codemirror-themes";

export enum EditorConnectionStatus {
	Disconnected = "disconnected",
	Connecting = "connecting",
	Connected = "connected",
	Error = "error",
}

export enum EditorLanguageId {
	TypeScript = "typescript",
	JavaScript = "javascript",
	Python = "python",
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
		case "py":
		case "pyw":
		case "pyi":
			return EditorLanguageId.Python;
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
			return javascript({
				jsx: true,
				typescript: true,
			});
		case EditorLanguageId.JavaScript:
			return javascript({
				jsx: true,
			});
		case EditorLanguageId.Python:
			return python();
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

export const editorThemeTomorrowNightBright = createTheme({
	settings: {
		background: "#0a0a0a",
		caret: "#00ff41",
		fontFamily: "'IBM Plex Mono', monospace",
		foreground: "#eaeaea",
		gutterBackground: "#0a0a0a",
		gutterBorder: "#222222",
		gutterForeground: "#6A6A6A",
		lineHighlight: "#1a1a1a",
		selection: "#424242",
		selectionMatch: "#424242",
	},
	styles: [
		{
			color: "#d27b53",
			tag: t.comment,
		},
		{
			color: "#d27b53",
			tag: t.lineComment,
		},
		{
			color: "#d27b53",
			tag: t.blockComment,
		},
		{
			color: "#d27b53",
			tag: t.docComment,
		},
		{
			color: "#eaeaea",
			tag: t.name,
		},
		{
			color: "#b9ca4a",
			tag: t.variableName,
		},
		{
			color: "#e78c45",
			tag: t.definition(t.variableName),
		},
		{
			color: "#99cc99",
			tag: t.propertyName,
		},
		{
			color: "#99cc99",
			tag: t.definition(t.propertyName),
		},
		{
			color: "#7aa6da",
			tag: t.function(t.variableName),
		},
		{
			color: "#7aa6da",
			tag: t.function(t.propertyName),
		},
		{
			color: "#b9ca4a",
			tag: t.labelName,
		},
		{
			color: "#d54e53",
			tag: t.keyword,
		},
		{
			color: "#eaeaea",
			tag: t.operator,
		},
		{
			color: "#eaeaea",
			tag: t.punctuation,
		},
		{
			color: "#eaeaea",
			tag: t.bracket,
		},
		{
			color: "#eaeaea",
			tag: t.angleBracket,
		},
		{
			color: "#eaeaea",
			tag: t.squareBracket,
		},
		{
			color: "#eaeaea",
			tag: t.paren,
		},
		{
			color: "#eaeaea",
			tag: t.brace,
		},
		{
			color: "#eaeaea",
			tag: t.separator,
		},
		{
			color: "#e7c547",
			tag: t.string,
		},
		{
			color: "#e7c547",
			tag: t.special(t.string),
		},
		{
			color: "#a16a94",
			tag: t.number,
		},
		{
			color: "#a16a94",
			tag: t.integer,
		},
		{
			color: "#a16a94",
			tag: t.float,
		},
		{
			color: "#a16a94",
			tag: t.bool,
		},
		{
			color: "#a16a94",
			tag: t.null,
		},
		{
			color: "#a16a94",
			tag: t.atom,
		},
		{
			color: "#e7c547",
			tag: t.regexp,
		},
		{
			color: "#e7c547",
			tag: t.escape,
		},
		{
			color: "#7aa6da",
			tag: t.typeName,
		},
		{
			color: "#7aa6da",
			tag: t.className,
		},
		{
			color: "#7aa6da",
			tag: t.namespace,
		},
		{
			color: "#d54e53",
			tag: t.macroName,
		},
		{
			color: "#a16a94",
			tag: t.literal,
		},
		{
			color: "#d54e53",
			tag: t.self,
		},
		{
			color: "#99cc99",
			tag: t.attributeName,
		},
		{
			color: "#e7c547",
			tag: t.attributeValue,
		},
		{
			color: "#d54e53",
			tag: t.tagName,
		},
		{
			color: "#d54e53",
			fontWeight: "bold",
			tag: t.heading,
		},
		{
			color: "#a16a94",
			tag: t.link,
			textDecoration: "underline",
		},
		{
			color: "#a16a94",
			tag: t.url,
			textDecoration: "underline",
		},
		{
			fontStyle: "italic",
			tag: t.emphasis,
		},
		{
			fontWeight: "bold",
			tag: t.strong,
		},
		{
			color: "#d54e53",
			tag: t.invalid,
		},
	],
	theme: "dark",
});
