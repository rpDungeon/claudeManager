// Review pending by Autumnlight
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { SerializeAddon } from "@xterm/addon-serialize";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import { SvelteMap } from "svelte/reactivity";
import { api, authTokenQueryGet } from "$lib/api/api.client";
import { settingsTerminalFontSizeGet } from "$lib/settings/settings.service.svelte";
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
	foregroundProcess: string | null;
	lastError: string | null;
	needsAttention: boolean;
	outputIdle: boolean;
	settledAt: number;
	onDataDisposable: {
		dispose: () => void;
	} | null;
	scrollLock: boolean;
	terminal: Terminal;
	websocket: EdenWebSocket | null;
};

const instances = new SvelteMap<TerminalId, TerminalInstance>();

export function terminalInstanceGet(terminalId: TerminalId): TerminalInstance | undefined {
	return instances.get(terminalId);
}

export function terminalInstanceAttentionClear(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (instance) {
		instance.needsAttention = false;
	}
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
		fontSize: settingsTerminalFontSizeGet(),
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
		foregroundProcess: null,
		lastError: null,
		needsAttention: false,
		onDataDisposable: null,
		outputIdle: false,
		scrollLock: false,
		settledAt: 0,
		terminal,
		websocket: null,
	});

	instances.set(terminalId, instance);
	return instance;
}

export function terminalInstanceDestroy(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	const state = reconnectStates.get(terminalId);
	if (state) {
		state.intentionalClose = true;
		if (state.timeout) {
			clearTimeout(state.timeout);
		}
		reconnectStates.delete(terminalId);
	}

	terminalWebsocketClose(terminalId);
	if (instance.onDataDisposable) {
		instance.onDataDisposable.dispose();
	}
	instance.terminal.dispose();
	instances.delete(terminalId);
}

export function terminalInstanceReset(terminalId: TerminalId, container: HTMLElement): void {
	terminalInstanceDestroy(terminalId);
	terminalInstanceCreate(terminalId);
	terminalInstanceMount(terminalId, container);
	terminalWebsocketConnect(terminalId);
}

export function terminalInstanceMount(terminalId: TerminalId, container: HTMLElement): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	if (instance.container === container) return;

	instance.container = container;
	instance.terminal.open(container);

	const textarea = container.querySelector("textarea.xterm-helper-textarea");
	if (textarea) {
		textarea.addEventListener(
			"paste",
			(event) => {
				event.preventDefault();
				event.stopImmediatePropagation();
			},
			{
				capture: true,
			},
		);
	}

	let selectionAnchor: {
		col: number;
		row: number;
	} | null = null;
	let selectionEnd: {
		col: number;
		row: number;
	} | null = null;
	let lastCopyTime = 0;

	instance.terminal.attachCustomKeyEventHandler((event) => {
		if (event.type !== "keydown") return true;

		if (event.ctrlKey && !event.shiftKey && event.code === "KeyC") {
			const now = Date.now();
			const selection = instance.terminal.getSelection();

			if (instance.terminal.hasSelection() && selection && now - lastCopyTime > 1000) {
				navigator.clipboard.writeText(selection);
				instance.terminal.clearSelection();
				selectionAnchor = null;
				selectionEnd = null;
				lastCopyTime = now;
				return false;
			}

			lastCopyTime = 0;
			return true;
		}

		if (event.ctrlKey && !event.shiftKey && event.code === "KeyV") {
			navigator.clipboard.readText().then((text) => {
				if (text && instance.websocket) {
					instance.websocket.send({
						data: text,
						type: "input",
					});
				}
			});
			return false;
		}

		if (
			event.shiftKey &&
			!event.ctrlKey &&
			!event.altKey &&
			(event.code === "ArrowLeft" || event.code === "ArrowRight")
		) {
			const buffer = instance.terminal.buffer.active;
			const cols = instance.terminal.cols;

			if (!selectionAnchor) {
				selectionAnchor = {
					col: buffer.cursorX,
					row: buffer.cursorY + buffer.baseY,
				};
				selectionEnd = {
					col: buffer.cursorX,
					row: buffer.cursorY + buffer.baseY,
				};
			}

			if (event.code === "ArrowLeft") {
				if (selectionEnd!.col > 0) {
					selectionEnd!.col--;
				} else if (selectionEnd!.row > 0) {
					selectionEnd!.row--;
					selectionEnd!.col = cols - 1;
				}
				instance.websocket?.send({
					data: "\x1b[D",
					type: "input",
				});
			} else {
				if (selectionEnd!.col < cols - 1) {
					selectionEnd!.col++;
				} else {
					selectionEnd!.row++;
					selectionEnd!.col = 0;
				}
				instance.websocket?.send({
					data: "\x1b[C",
					type: "input",
				});
			}

			const startCol = Math.min(selectionAnchor.col, selectionEnd!.col);
			const startRow = Math.min(selectionAnchor.row, selectionEnd!.row);
			const endCol = Math.max(selectionAnchor.col, selectionEnd!.col);
			const endRow = Math.max(selectionAnchor.row, selectionEnd!.row);

			if (startRow === endRow) {
				instance.terminal.select(startCol, startRow, endCol - startCol);
			} else {
				instance.terminal.selectLines(startRow, endRow);
			}

			return false;
		}

		if (
			!event.shiftKey &&
			(event.code === "ArrowLeft" ||
				event.code === "ArrowRight" ||
				event.code === "ArrowUp" ||
				event.code === "ArrowDown")
		) {
			selectionAnchor = null;
			selectionEnd = null;
		}

		return true;
	});

	instance.addons.fit.fit();
}

export function terminalInstanceFit(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	instance.addons.fit.fit();

	if (instance.websocket && instance.connectionStatus === TerminalConnectionStatus.Connected) {
		const dims = instance.addons.fit.proposeDimensions();
		if (dims) {
			instance.websocket.send({
				cols: dims.cols - 1,
				rows: dims.rows - 1,
				type: "resize",
			});
		}
	}
}

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30_000;

type ReconnectState = {
	attempt: number;
	timeout: ReturnType<typeof setTimeout> | null;
	intentionalClose: boolean;
};

const reconnectStates = new Map<TerminalId, ReconnectState>();

function getReconnectState(terminalId: TerminalId): ReconnectState {
	let state = reconnectStates.get(terminalId);
	if (!state) {
		state = {
			attempt: 0,
			intentionalClose: false,
			timeout: null,
		};
		reconnectStates.set(terminalId, state);
	}
	return state;
}

function scheduleReconnect(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	if (instance.websocket) return;

	const state = getReconnectState(terminalId);
	if (state.intentionalClose || state.timeout) return;

	const delay = Math.min(RECONNECT_BASE_MS * 2 ** state.attempt, RECONNECT_MAX_MS);
	state.attempt++;

	state.timeout = setTimeout(() => {
		state.timeout = null;
		terminalWebsocketConnect(terminalId);
	}, delay);
}

export function terminalWebsocketConnect(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	const reconnectState = getReconnectState(terminalId);
	reconnectState.intentionalClose = false;

	if (reconnectState.timeout) {
		clearTimeout(reconnectState.timeout);
		reconnectState.timeout = null;
	}

	if (reconnectState.attempt > 0) {
		instance.terminal.reset();
	}

	if (instance.websocket) {
		reconnectState.intentionalClose = true;
		terminalWebsocketClose(terminalId);
		reconnectState.intentionalClose = false;
	}

	instance.connectionStatus = TerminalConnectionStatus.Connecting;
	instance.lastError = null;
	const ws = api.ws
		.terminal({
			terminalId,
		})
		.subscribe({
			query: authTokenQueryGet(),
		});

	ws.subscribe((event) => {
		terminalDispatchServerMessage(terminalId, event.data);
	});

	ws.on("open", () => {
		instance.connectionStatus = TerminalConnectionStatus.Connected;
		instance.settledAt = Date.now() + 10_000;
		reconnectState.attempt = 0;

		const dims = instance.addons.fit.proposeDimensions();
		if (dims) {
			ws.send({
				cols: dims.cols - 1,
				rows: dims.rows - 1,
				type: "resize",
			});
		}
	});

	ws.on("close", () => {
		const currentInstance = instances.get(terminalId);
		if (!currentInstance || currentInstance.websocket !== ws) {
			return;
		}

		currentInstance.connectionStatus = TerminalConnectionStatus.Disconnected;
		currentInstance.websocket = null;
		scheduleReconnect(terminalId);
	});

	ws.on("error", () => {
		const currentInstance = instances.get(terminalId);
		if (!currentInstance || currentInstance.websocket !== ws) {
			return;
		}

		currentInstance.connectionStatus = TerminalConnectionStatus.Error;
		currentInstance.lastError = "WebSocket connection error";
		currentInstance.websocket = null;
	});

	instance.websocket = ws;

	if (instance.onDataDisposable) {
		instance.onDataDisposable.dispose();
	}
	instance.onDataDisposable = instance.terminal.onData((data) => {
		ws.send({
			data,
			type: "input",
		});
	});
}

export function terminalWebsocketClose(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance?.websocket) return;

	const state = reconnectStates.get(terminalId);
	if (state?.timeout) {
		clearTimeout(state.timeout);
		state.timeout = null;
	}

	instance.websocket.close();
	instance.websocket = null;
}

export function terminalWebsocketForceReconnect(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	const state = getReconnectState(terminalId);
	state.intentionalClose = true;

	if (state.timeout) {
		clearTimeout(state.timeout);
		state.timeout = null;
	}

	if (instance.websocket) {
		instance.websocket.close();
		instance.websocket = null;
	}

	state.attempt = 0;
	state.intentionalClose = false;

	instance.terminal.reset();
	terminalWebsocketConnect(terminalId);
}

function terminalIsNearBottom(terminal: Terminal): boolean {
	const buffer = terminal.buffer.active;
	const scrollbackTop = buffer.baseY;
	const viewportTop = buffer.viewportY;
	return viewportTop >= scrollbackTop - 3;
}

export function terminalScrollLockToggle(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;
	instance.scrollLock = !instance.scrollLock;
}

export function terminalScrollLockGet(terminalId: TerminalId): boolean {
	return instances.get(terminalId)?.scrollLock ?? false;
}

function terminalDispatchServerMessage(terminalId: TerminalId, message: ServerMessage): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	switch (message.type) {
		case "output": {
			const wasNearBottom = terminalIsNearBottom(instance.terminal);
			const scrollPos = instance.terminal.buffer.active.viewportY;

			instance.terminal.write(message.data, () => {
				if (instance.scrollLock) {
					instance.terminal.scrollToBottom();
				} else if (!wasNearBottom) {
					instance.terminal.scrollToLine(scrollPos);
				}
			});
			break;
		}

		case "exit":
			instance.exitCode = message.code;
			break;

		case "error":
			instance.lastError = message.message;
			break;

		case "foreground_process":
			instance.foregroundProcess = message.process;
			break;

		case "output_idle":
			if (!message.idle) {
				instance.needsAttention = false;
			}
			if (message.idle && !instance.outputIdle && Date.now() > instance.settledAt) {
				instance.needsAttention = true;
			}
			instance.outputIdle = message.idle;
			break;

		case "ping":
			if (instance.websocket) {
				instance.websocket.send({
					type: "pong",
				});
			}
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

export function terminalInstancePaste(terminalId: TerminalId, text: string): void {
	const instance = instances.get(terminalId);
	if (!instance?.websocket) return;

	instance.websocket.send({
		data: text,
		type: "input",
	});
}

export function terminalInstanceGetSelection(terminalId: TerminalId): string {
	const instance = instances.get(terminalId);
	if (!instance) return "";

	return instance.terminal.getSelection();
}

export async function terminalInstanceCopySelection(terminalId: TerminalId): Promise<boolean> {
	const instance = instances.get(terminalId);
	if (!instance) return false;

	const selection = instance.terminal.getSelection();
	if (!selection) return false;

	try {
		await navigator.clipboard.writeText(selection);
		return true;
	} catch {
		return false;
	}
}

export async function terminalInstanceCopyViewport(terminalId: TerminalId): Promise<boolean> {
	const instance = instances.get(terminalId);
	if (!instance) return false;

	const terminal = instance.terminal;
	const buffer = terminal.buffer.active;
	const lines: string[] = [];

	for (let i = buffer.viewportY; i < buffer.viewportY + terminal.rows; i++) {
		const line = buffer.getLine(i);
		lines.push(line ? line.translateToString(true) : "");
	}

	while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
		lines.pop();
	}

	const text = lines.join("\n");
	if (!text) return false;

	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function terminalInstanceSelectAll(terminalId: TerminalId): void {
	const instance = instances.get(terminalId);
	if (!instance) return;

	instance.terminal.selectAll();
}

export function terminalInstancesSetFontSize(fontSize: number): void {
	for (const instance of instances.values()) {
		instance.terminal.options.fontSize = fontSize;
		instance.addons.fit.fit();
	}
}

export type { TerminalInstance, TerminalInstanceAddons };
