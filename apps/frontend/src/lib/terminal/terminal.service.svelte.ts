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

type TerminalInstanceAddons = {
	fit: FitAddon;
	search: SearchAddon;
	serialize: SerializeAddon;
	webgl: WebglAddon | null;
	webLinks: WebLinksAddon;
};

type TerminalInstance = {
	addons: TerminalInstanceAddons;
	container: HTMLElement | null;
	connectionStatus: TerminalConnectionStatus;
	exitCode: number | null;
	lastError: string | null;
	terminal: Terminal;
	websocket: EdenWebSocket | null;
};

const instances = new SvelteMap<TerminalId, TerminalInstance>();

export function terminalInstanceGet(terminalId: TerminalId): TerminalInstance | undefined {
	return instances.get(terminalId);
}

export function terminalInstanceCreate(terminalId: TerminalId): TerminalInstance {
	const existing = instances.get(terminalId);
	if (existing) return existing;

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

	const instance: TerminalInstance = $state({
		addons: {
			fit: fitAddon,
			search: searchAddon,
			serialize: serializeAddon,
			webgl: null,
			webLinks: webLinksAddon,
		},
		connectionStatus: TerminalConnectionStatus.Disconnected,
		container: null,
		exitCode: null,
		lastError: null,
		terminal,
		websocket: null,
	});

	instances.set(terminalId, instance);
	return instance;
}

export function terminalInstanceDestroy(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	terminalWebsocketClose(terminalId);
	instance.terminal.dispose();
	instances.delete(terminalId);
}

export function terminalInstanceMount(terminalId: TerminalId, container: HTMLElement): void {
	const instance = instances.get(terminalId);
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

export function terminalInstanceFit(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
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

export function terminalWebsocketConnect(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	if (instance.websocket) {
		terminalWebsocketClose(terminalId);
	}

	instance.connectionStatus = TerminalConnectionStatus.Connecting;
	instance.lastError = null;

	const ws = api.ws
		.terminal({
			terminalId,
		})
		.subscribe();

	ws.on("open", () => {
		instance.connectionStatus = TerminalConnectionStatus.Connected;

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
		terminalDispatchServerMessage(terminalId, event.data);
	});

	ws.on("close", () => {
		instance.connectionStatus = TerminalConnectionStatus.Disconnected;
	});

	ws.on("error", () => {
		instance.connectionStatus = TerminalConnectionStatus.Error;
		instance.lastError = "WebSocket connection error";
	});

	instance.websocket = ws;

	instance.terminal.onData((data) => {
		ws.send({
			data,
			type: "input",
		});
	});
}

export function terminalWebsocketClose(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance?.websocket) return;

	instance.websocket.close();
	instance.websocket = null;
}

function terminalDispatchServerMessage(terminalId: TerminalId, message: ServerMessage): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	switch (message.type) {
		case "output":
			instance.terminal.write(message.data);
			break;

		case "exit":
			instance.exitCode = message.code;
			break;

		case "error":
			instance.lastError = message.message;
			break;
	}
}

export function terminalInstanceSearch(
	terminalId: TerminalId,
	query: string,
	options?: {
		caseSensitive?: boolean;
		regex?: boolean;
	},
): boolean {
	const instance = instances.get(terminalId);
	if (!instance) return false;

	return instance.addons.search.findNext(query, {
		caseSensitive: options?.caseSensitive,
		regex: options?.regex,
	});
}

export function terminalInstanceSearchPrevious(
	terminalId: TerminalId,
	query: string,
	options?: {
		caseSensitive?: boolean;
		regex?: boolean;
	},
): boolean {
	const instance = instances.get(terminalId);
	if (!instance) return false;

	return instance.addons.search.findPrevious(query, {
		caseSensitive: options?.caseSensitive,
		regex: options?.regex,
	});
}

export function terminalInstanceSearchClear(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	instance.addons.search.clearDecorations();
}

export function terminalInstanceSerialize(terminalId: TerminalId): string | null {
	const instance = instances.get(terminalId);
	if (!instance) return null;

	return instance.addons.serialize.serialize();
}

export function terminalInstanceFocus(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	instance.terminal.focus();
}

export type { TerminalInstance, TerminalInstanceAddons };
