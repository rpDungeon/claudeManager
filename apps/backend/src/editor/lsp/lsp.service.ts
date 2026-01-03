import { spawn, type Subprocess } from "bun";
import { EditorLspLanguageId } from "@claude-manager/common/src/editor/lsp.types";

type Unsubscribe = () => void;

type LspServerInstance = {
	kill: () => void;
	onMessage: (callback: (jsonRpcContent: string) => void) => Unsubscribe;
	sendRaw: (jsonRpcContent: string) => void;
};

type InternalLspState = {
	callbacks: Set<(jsonRpcContent: string) => void>;
	createdAt: Date;
	languageId: EditorLspLanguageId;
	messageBuffer: string;
	process: Subprocess;
	rootUri: string;
};

function languageServerCommandGet(languageId: EditorLspLanguageId): string[] {
	switch (languageId) {
		case EditorLspLanguageId.TypeScript:
		case EditorLspLanguageId.JavaScript:
			return ["npx", "typescript-language-server", "--stdio"];
		case EditorLspLanguageId.Svelte:
			return ["npx", "svelteserver", "--stdio"];
		case EditorLspLanguageId.CSS:
			return ["npx", "vscode-css-language-server", "--stdio"];
		case EditorLspLanguageId.HTML:
			return ["npx", "vscode-html-language-server", "--stdio"];
		case EditorLspLanguageId.JSON:
			return ["npx", "vscode-json-language-server", "--stdio"];
		default:
			throw new Error(`Unsupported language: ${languageId}`);
	}
}

class LspService {
	private instances = new Map<string, InternalLspState>();

	private instanceKeyGenerate(rootUri: string, languageId: EditorLspLanguageId): string {
		return `${languageId}:${rootUri}`;
	}

	private instanceWrap(state: InternalLspState): LspServerInstance {
		return {
			kill: () => {
				const key = this.instanceKeyGenerate(state.rootUri, state.languageId);
				this.instanceKill(key);
			},
			onMessage: (callback) => {
				state.callbacks.add(callback);
				return () => {
					state.callbacks.delete(callback);
				};
			},
			sendRaw: (jsonRpcContent) => {
				const header = `Content-Length: ${Buffer.byteLength(jsonRpcContent)}\r\n\r\n`;
				const stdin = state.process.stdin;
				if (stdin && typeof stdin !== "number") {
					stdin.write(header + jsonRpcContent);
				}
			},
		};
	}

	instanceGet(rootUri: string, languageId: EditorLspLanguageId): LspServerInstance | undefined {
		const key = this.instanceKeyGenerate(rootUri, languageId);
		const state = this.instances.get(key);
		if (!state) return undefined;
		return this.instanceWrap(state);
	}

	instanceSpawn(rootUri: string, languageId: EditorLspLanguageId): LspServerInstance {
		const key = this.instanceKeyGenerate(rootUri, languageId);
		const existing = this.instances.get(key);
		if (existing) {
			return this.instanceWrap(existing);
		}

		const command = languageServerCommandGet(languageId);
		const [cmd, ...args] = command;

		const process = spawn([cmd, ...args], {
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
		});

		const callbacks = new Set<(jsonRpcContent: string) => void>();

		const state: InternalLspState = {
			callbacks,
			createdAt: new Date(),
			languageId,
			messageBuffer: "",
			process,
			rootUri,
		};

		this.instances.set(key, state);

		const processStdout = async () => {
			const reader = process.stdout.getReader();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = new TextDecoder().decode(value);
					state.messageBuffer += chunk;

					while (true) {
						const headerEnd = state.messageBuffer.indexOf("\r\n\r\n");
						if (headerEnd === -1) break;

						const header = state.messageBuffer.slice(0, headerEnd);
						const contentLengthMatch = header.match(/Content-Length:\s*(\d+)/i);
						if (!contentLengthMatch) {
							state.messageBuffer = state.messageBuffer.slice(headerEnd + 4);
							continue;
						}

						const contentLength = Number.parseInt(contentLengthMatch[1], 10);
						const messageStart = headerEnd + 4;
						const messageEnd = messageStart + contentLength;

						if (state.messageBuffer.length < messageEnd) break;

						const content = state.messageBuffer.slice(messageStart, messageEnd);
						state.messageBuffer = state.messageBuffer.slice(messageEnd);

						for (const cb of callbacks) {
							cb(content);
						}
					}
				}
			} catch (e) {
				console.error("[LSP] Stdout read error:", e);
			}
		};

		const processStderr = async () => {
			const reader = process.stderr.getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const text = new TextDecoder().decode(value);
					console.error(`[LSP ${languageId}] stderr:`, text);
				}
			} catch (e) {
				console.error("[LSP] Stderr read error:", e);
			}
		};

		processStdout();
		processStderr();

		process.exited.then(() => {
			console.log(`[LSP] Language server ${languageId} exited`);
			this.instances.delete(key);
			callbacks.clear();
		});

		return this.instanceWrap(state);
	}

	instanceKill(key: string): boolean {
		const state = this.instances.get(key);
		if (!state) return false;

		state.callbacks.clear();
		state.process.kill();
		this.instances.delete(key);
		return true;
	}

	instancesCount(): number {
		return this.instances.size;
	}
}

export const editorLspService = new LspService();
