import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { LSClient, languageServerWithClient } from "@valtown/codemirror-ls";
import { LSWebSocketTransport } from "@valtown/codemirror-ls/transport";
import { basicSetup, EditorView } from "codemirror";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const SAMPLE_CODE = `// TypeScript IntelliSense Demo
// Try typing below to see autocomplete, hover for types

interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

// Try typing "users." below to see autocomplete
// Or hover over variables to see their types

`;

function generateSessionId(): string {
	return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function renderHoverContent(
	dom: HTMLElement,
	contents:
		| string
		| {
				kind: string;
				value: string;
		  }
		| {
				language: string;
				value: string;
		  }
		| Array<
				| string
				| {
						language: string;
						value: string;
				  }
		  >,
) {
	let text = "";
	if (typeof contents === "string") {
		text = contents;
	} else if (Array.isArray(contents)) {
		text = contents.map((c) => (typeof c === "string" ? c : c.value)).join("\n\n");
	} else if ("value" in contents) {
		text = contents.value;
	}

	const pre = document.createElement("pre");
	pre.style.margin = "0";
	pre.style.padding = "8px 12px";
	pre.style.fontSize = "13px";
	pre.style.fontFamily = "'IBM Plex Mono', monospace";
	pre.style.whiteSpace = "pre-wrap";
	pre.style.maxWidth = "500px";
	pre.style.maxHeight = "300px";
	pre.style.overflow = "auto";
	pre.textContent = text;
	dom.appendChild(pre);
}

function App() {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const transportRef = useRef<LSWebSocketTransport | null>(null);
	const clientRef = useRef<LSClient | null>(null);
	const isConnectingRef = useRef(false);
	const isMountedRef = useRef(false);

	const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
	const [errorMsg, setErrorMsg] = useState<string>("");

	const cleanup = () => {
		if (viewRef.current) {
			viewRef.current.destroy();
			viewRef.current = null;
		}
		if (clientRef.current) {
			clientRef.current.close();
			clientRef.current = null;
		}
		if (transportRef.current) {
			transportRef.current.dispose();
			transportRef.current = null;
		}
	};

	const connect = async () => {
		if (isConnectingRef.current) {
			console.log("[App] Already connecting, skipping");
			return;
		}

		isConnectingRef.current = true;
		cleanup();

		setStatus("connecting");
		setErrorMsg("");

		const sessionId = generateSessionId();
		const wsUrl = `ws://${window.location.host}/ws?sessionId=${sessionId}`;

		try {
			const transport = new LSWebSocketTransport(wsUrl, {
				onWSClose: (e) => {
					console.log("[Transport] WebSocket closed", e.code, e.reason);
					if (isMountedRef.current) {
						setStatus("disconnected");
					}
				},
				onWSError: (e) => {
					console.error("[Transport] WebSocket error", e);
					if (isMountedRef.current) {
						setStatus("error");
						setErrorMsg("WebSocket connection error");
					}
				},
				onWSOpen: () => {
					console.log("[Transport] WebSocket opened");
				},
			});

			transportRef.current = transport;

			await transport.connect();
			console.log("[Transport] Connected to WebSocket");

			const client = new LSClient({
				initializationOptions: {
					enable: true,
					lint: true,
					unstable: true,
				},
				transport,
				workspaceFolders: null,
			});

			clientRef.current = client;

			await client.initialize();
			console.log("[LSP] Client initialized", client.capabilities);

			if (!isMountedRef.current) {
				cleanup();
				return;
			}

			setStatus("connected");

			if (editorRef.current) {
				const documentUri = "untitled:main.ts";

				const lspExtensions = languageServerWithClient({
					client,
					documentUri,
					features: {
						hovers: {
							render: renderHoverContent,
						},
					},
					languageId: "typescript",
					sendDidOpen: true,
				});

				const view = new EditorView({
					doc: SAMPLE_CODE,
					extensions: [
						basicSetup,
						javascript({
							typescript: true,
						}),
						oneDark,
						...lspExtensions,
						EditorView.theme({
							".cm-gutters": {
								backgroundColor: "#0a0a0a",
								borderRight: "1px solid #333",
							},
							".cm-scroller": {
								fontFamily: "'IBM Plex Mono', monospace",
							},
							"&": {
								fontSize: "14px",
								height: "100%",
							},
						}),
					],
					parent: editorRef.current,
				});

				viewRef.current = view;
			}
		} catch (err) {
			console.error("[App] Connection failed:", err);
			if (isMountedRef.current) {
				setStatus("error");
				setErrorMsg(err instanceof Error ? err.message : "Unknown error");
			}
		} finally {
			isConnectingRef.current = false;
		}
	};

	useEffect(() => {
		isMountedRef.current = true;
		connect();

		return () => {
			isMountedRef.current = false;
			cleanup();
		};
	}, []);

	return (
		<div className="app">
			<header className="header">
				<h1>vtlsp + CodeMirror MVP</h1>
				<div className="status-bar">
					<span className={`status-indicator ${status}`} />
					<span className="status-text">
						{status === "connected" && "Connected to TypeScript LSP"}
						{status === "connecting" && "Connecting..."}
						{status === "disconnected" && "Disconnected"}
						{status === "error" && `Error: ${errorMsg}`}
					</span>
					{status !== "connecting" && (
						<button className="reconnect-btn" onClick={connect} type="button">
							{status === "connected" ? "Reconnect" : "Connect"}
						</button>
					)}
				</div>
			</header>
			<main className="editor-container">
				<div className="editor" ref={editorRef} />
			</main>
			<footer className="footer">
				<span>Type "." after a variable for autocomplete</span>
				<span>Hover over variables for type info</span>
				<span>Ctrl+Space for suggestions</span>
			</footer>
		</div>
	);
}

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
