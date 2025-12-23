import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { SerializeAddon } from "@xterm/addon-serialize";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import { SvelteMap } from "svelte/reactivity";
import { api } from "$lib/api/api.client";
import { TerminalConnectionStatus, terminalThemeCrt } from "./terminal.lib";

type EdenWebSocket = ReturnType<ReturnType<typeof api.ws.terminal>["subscribe"]>;

type EdenOnMessage = Parameters<Parameters<EdenWebSocket["subscribe"]>[0]>[0];
type ServerMessage = EdenOnMessage["data"];

type TerminalInstanceState = {
	connectionStatus: TerminalConnectionStatus;
	exitCode: number | null;
};

type TerminalInstanceCallbacks = {
	onConnectionStatusChange?: (status: TerminalConnectionStatus) => void;
	onError?: (message: string) => void;
	onExit?: (code: number) => void;
};

type TerminalInstanceAddons = {
	fit: FitAddon;
	search: SearchAddon;
	serialize: SerializeAddon;
	webLinks: WebLinksAddon;
	webgl: WebglAddon | null;
};

type TerminalInstance = {
	addons: TerminalInstanceAddons;
	callbacks: TerminalInstanceCallbacks;
	container: HTMLElement | null;
	state: TerminalInstanceState;
	terminal: Terminal;
	websocket: EdenWebSocket | null;
};

class TerminalService {
	instances = new SvelteMap<TerminalId, TerminalInstance>();

	instanceCreate(terminalId: TerminalId, callbacks: TerminalInstanceCallbacks = {}): TerminalInstance {
		const existing = this.instances.get(terminalId);
		if (existing) {
			existing.callbacks = {
				...existing.callbacks,
				...callbacks,
			};
			return existing;
		}

		const terminal = new Terminal({
			allowProposedApi: true,
			convertEol: true,
			cursorBlink: true,
			cursorStyle: "block",
			fontFamily: "'IBM Plex Mono', monospace",
			fontSize: 12,
			lineHeight: 1.2,
			scrollback: 10_000,
			theme: terminalThemeCrt,
		});

		const fitAddon = new FitAddon();
		const searchAddon = new SearchAddon();
		const serializeAddon = new SerializeAddon();
		const webLinksAddon = new WebLinksAddon();

		terminal.loadAddon(fitAddon);
		terminal.loadAddon(searchAddon);
		terminal.loadAddon(serializeAddon);
		terminal.loadAddon(webLinksAddon);

		const instance: TerminalInstance = {
			addons: {
				fit: fitAddon,
				search: searchAddon,
				serialize: serializeAddon,
				webgl: null,
				webLinks: webLinksAddon,
			},
			callbacks,
			container: null,
			state: {
				connectionStatus: TerminalConnectionStatus.Disconnected,
				exitCode: null,
			},
			terminal,
			websocket: null,
		};

		this.instances.set(terminalId, instance);
		return instance;
	}

	instanceGet(terminalId: TerminalId): TerminalInstance | undefined {
		return this.instances.get(terminalId);
	}

	instanceDestroy(terminalId: TerminalId): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		this.websocketClose(terminalId);
		instance.terminal.dispose();
		this.instances.delete(terminalId);
	}

	instanceMount(terminalId: TerminalId, container: HTMLElement): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		if (instance.container === container) return;

		instance.container = container;
		instance.terminal.open(container);

		if (!instance.addons.webgl) {
			try {
				const webglAddon = new WebglAddon();
				webglAddon.onContextLoss(() => {
					webglAddon.dispose();
					instance.addons.webgl = null;
				});
				instance.terminal.loadAddon(webglAddon);
				instance.addons.webgl = webglAddon;
			} catch {
				console.warn("WebGL addon failed to load, using default renderer");
			}
		}

		instance.addons.fit.fit();
	}

	instanceFit(terminalId: TerminalId): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		instance.addons.fit.fit();

		if (instance.websocket) {
			const dims = instance.addons.fit.proposeDimensions();
			if (dims) {
				instance.websocket.send({
					cols: dims.cols,
					rows: dims.rows,
					type: "resize",
				});
			}
		}
	}

	websocketConnect(terminalId: TerminalId): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		if (instance.websocket) {
			this.websocketClose(terminalId);
		}

		this.instanceStateUpdate(terminalId, {
			connectionStatus: TerminalConnectionStatus.Connecting,
		});

		const ws = api.ws
			.terminal({
				terminalId,
			})
			.subscribe();

		ws.on("open", () => {
			this.instanceStateUpdate(terminalId, {
				connectionStatus: TerminalConnectionStatus.Connected,
			});

			const dims = instance.addons.fit.proposeDimensions();
			if (dims) {
				ws.send({
					cols: dims.cols,
					rows: dims.rows,
					type: "resize",
				});
			}
		});

		ws.subscribe((event) => {
			this.dispatchServerMessage(terminalId, event.data);
		});

		ws.on("close", () => {
			this.instanceStateUpdate(terminalId, {
				connectionStatus: TerminalConnectionStatus.Disconnected,
			});
		});

		ws.on("error", () => {
			this.instanceStateUpdate(terminalId, {
				connectionStatus: TerminalConnectionStatus.Error,
			});
			instance.callbacks.onError?.("WebSocket connection error");
		});

		instance.websocket = ws;

		instance.terminal.onData((data) => {
			ws.send({
				data,
				type: "input",
			});
		});
	}

	websocketClose(terminalId: TerminalId): void {
		const instance = this.instances.get(terminalId);
		if (!instance?.websocket) return;

		instance.websocket.close();
		instance.websocket = null;
	}

	private dispatchServerMessage(terminalId: TerminalId, message: ServerMessage): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		switch (message.type) {
			case "output":
				instance.terminal.write(message.data);
				break;

			case "exit":
				this.instanceStateUpdate(terminalId, {
					exitCode: message.code,
				});
				instance.callbacks.onExit?.(message.code);
				break;

			case "error":
				instance.callbacks.onError?.(message.message);
				break;
		}
	}

	private instanceStateUpdate(terminalId: TerminalId, partial: Partial<TerminalInstanceState>): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		const prevStatus = instance.state.connectionStatus;
		instance.state = {
			...instance.state,
			...partial,
		};

		if (partial.connectionStatus && partial.connectionStatus !== prevStatus) {
			instance.callbacks.onConnectionStatusChange?.(partial.connectionStatus);
		}
	}

	instanceSearch(
		terminalId: TerminalId,
		query: string,
		options?: {
			caseSensitive?: boolean;
			regex?: boolean;
		},
	): boolean {
		const instance = this.instances.get(terminalId);
		if (!instance) return false;

		return instance.addons.search.findNext(query, {
			caseSensitive: options?.caseSensitive,
			regex: options?.regex,
		});
	}

	instanceSearchPrevious(
		terminalId: TerminalId,
		query: string,
		options?: {
			caseSensitive?: boolean;
			regex?: boolean;
		},
	): boolean {
		const instance = this.instances.get(terminalId);
		if (!instance) return false;

		return instance.addons.search.findPrevious(query, {
			caseSensitive: options?.caseSensitive,
			regex: options?.regex,
		});
	}

	instanceSearchClear(terminalId: TerminalId): void {
		const instance = this.instances.get(terminalId);
		if (!instance) return;

		instance.addons.search.clearDecorations();
	}

	instanceSerialize(terminalId: TerminalId): string | null {
		const instance = this.instances.get(terminalId);
		if (!instance) return null;

		return instance.addons.serialize.serialize();
	}
}

export const terminalService = new TerminalService();

export type { TerminalInstance, TerminalInstanceAddons, TerminalInstanceCallbacks, TerminalInstanceState };
