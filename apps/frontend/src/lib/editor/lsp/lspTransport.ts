import { EditorLspLanguageId } from "@claude-manager/common/src/editor/lsp.types";
import type { Transport } from "@codemirror/lsp-client";
import { PUBLIC_API_URL } from "$env/static/public";

type LspSessionConfig = {
	rootUri: string;
	languageId: EditorLspLanguageId;
	sessionId: string;
};

export function editorLspTransportCreate(config: LspSessionConfig): Promise<Transport> {
	const handlers: ((value: string) => void)[] = [];

	const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const apiHost = PUBLIC_API_URL ? new URL(PUBLIC_API_URL).host : window.location.host;
	const token = localStorage.getItem("auth_token");
	const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
	const wsUrl = `${wsProtocol}//${apiHost}/ws/lsp/${config.sessionId}${tokenQuery}`;

	const socket = new WebSocket(wsUrl);

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			socket.close();
			reject(new Error("LSP connection timeout"));
		}, 10_000);

		socket.onopen = () => {
			socket.send(
				JSON.stringify({
					languageId: config.languageId,
					rootUri: config.rootUri,
					type: "initialize",
				}),
			);
		};

		socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);

				if (message.type === "ready") {
					clearTimeout(timeout);
					resolve({
						send(jsonRpcMessage: string) {
							socket.send(
								JSON.stringify({
									content: jsonRpcMessage,
									type: "jsonrpc",
								}),
							);
						},
						subscribe(handler: (value: string) => void) {
							handlers.push(handler);
						},
						unsubscribe(handler: (value: string) => void) {
							const idx = handlers.indexOf(handler);
							if (idx >= 0) handlers.splice(idx, 1);
						},
					});
					return;
				}

				if (message.type === "jsonrpc") {
					for (const h of handlers) {
						h(message.content);
					}
					return;
				}

				if (message.type === "ping") {
					socket.send(
						JSON.stringify({
							type: "pong",
						}),
					);
					return;
				}

				if (message.type === "error") {
					console.error("[LSP] Server error:", message.message);
				}
			} catch (e) {
				console.error("[LSP] Failed to parse message:", e);
			}
		};

		socket.onerror = (error) => {
			clearTimeout(timeout);
			console.error("[LSP] WebSocket error:", error);
			reject(new Error("LSP WebSocket connection failed"));
		};

		socket.onclose = () => {
			clearTimeout(timeout);
			handlers.length = 0;
		};
	});
}

export function editorLanguageIdToLspLanguageId(languageId: string): EditorLspLanguageId | null {
	switch (languageId) {
		case "typescript":
			return EditorLspLanguageId.TypeScript;
		case "javascript":
			return EditorLspLanguageId.JavaScript;
		case "python":
			return EditorLspLanguageId.Python;
		case "svelte":
			return EditorLspLanguageId.Svelte;
		case "css":
			return EditorLspLanguageId.CSS;
		case "html":
			return EditorLspLanguageId.HTML;
		case "json":
			return EditorLspLanguageId.JSON;
		default:
			return null;
	}
}
