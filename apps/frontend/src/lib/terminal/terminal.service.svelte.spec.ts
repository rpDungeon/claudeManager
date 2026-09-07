import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiTerminals, apiWsTerminal, pasteImagePost } = vi.hoisted(() => {
	const pasteImagePostMock = vi.fn();
	return {
		apiTerminals: vi.fn(() => ({
			"paste-image": {
				post: pasteImagePostMock,
			},
		})),
		apiWsTerminal: vi.fn(),
		pasteImagePost: pasteImagePostMock,
	};
});

vi.mock("$lib/api/api.client", () => ({
	api: {
		terminals: apiTerminals,
		ws: {
			terminal: apiWsTerminal,
		},
	},
	authTokenQueryGet: vi.fn(),
}));

import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import {
	terminalInstanceCreate,
	terminalInstanceDestroy,
	terminalInstanceFit,
	terminalInstanceGet,
	terminalInstanceInput,
	terminalInstanceMount,
	terminalInstancePaste,
	terminalWebsocketConnect,
} from "./terminal.service.svelte";

const terminalId = "terminal:paste-test" as TerminalId;

type ClipboardItemLike = {
	getAsFile: () => File | null;
	type: string;
};

function clipboardPasteDispatch(textarea: HTMLTextAreaElement, items: ClipboardItemLike[], text = ""): void {
	const event = new Event("paste", {
		bubbles: true,
		cancelable: true,
	});
	Object.defineProperty(event, "clipboardData", {
		configurable: true,
		value: {
			getData: (format: string) => (format === "text/plain" ? text : ""),
			items,
		},
	});
	textarea.dispatchEvent(event);
}

function tick(): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, 0);
	return promise;
}

describe("terminal paste", () => {
	let container: HTMLDivElement;
	let textarea: HTMLTextAreaElement;
	let websocket = {
		close: vi.fn(),
		on: vi.fn<(event: string, callback: () => void) => void>(),
		send: vi.fn(),
		subscribe: vi.fn(),
	};
	let websocketSend = websocket.send;
	let clipboardReadText = vi.fn();

	beforeEach(() => {
		pasteImagePost.mockReset();
		apiTerminals.mockClear();
		apiWsTerminal.mockReset();
		websocket = {
			close: vi.fn(),
			on: vi.fn<(event: string, callback: () => void) => void>(),
			send: vi.fn(),
			subscribe: vi.fn(),
		};
		websocketSend = websocket.send;
		apiWsTerminal.mockReturnValue({
			subscribe: vi.fn(() => websocket),
		});
		clipboardReadText = vi.fn().mockResolvedValue("clipboard text");
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				readText: clipboardReadText,
				writeText: vi.fn(),
			},
		});

		container = document.createElement("div");
		document.body.append(container);
		terminalInstanceCreate(terminalId);
		terminalInstanceMount(terminalId, container);
		terminalWebsocketConnect(terminalId);
		const mountedTextarea = container.querySelector("textarea.xterm-helper-textarea");
		if (!(mountedTextarea instanceof HTMLTextAreaElement)) {
			throw new Error("Expected xterm helper textarea");
		}
		textarea = mountedTextarea;
	});

	afterEach(async () => {
		await tick();
		terminalInstanceDestroy(terminalId);
		container.remove();
		vi.restoreAllMocks();
	});

	it.each([
		[
			80,
			78,
		],
		[
			2,
			1,
		],
	])("reserves two columns when fitting %i columns on connect and resize", (cols, expectedCols) => {
		const instance = terminalInstanceGet(terminalId);
		const onOpen = websocket.on.mock.calls.find(([event]) => event === "open")?.[1];
		if (!(instance && onOpen)) throw new Error("Expected terminal and websocket open handler");
		vi.spyOn(instance.addons.fit, "proposeDimensions").mockReturnValue({
			cols,
			rows: 24,
		});
		vi.spyOn(instance.addons.fit, "fit").mockImplementation(() => {});

		onOpen();
		expect(websocketSend).toHaveBeenLastCalledWith({
			cols: expectedCols,
			rows: 23,
			type: "resize",
		});
		websocketSend.mockClear();
		terminalInstanceFit(terminalId);
		expect(websocketSend).toHaveBeenCalledExactlyOnceWith({
			cols: expectedCols,
			rows: 23,
			type: "resize",
		});
	});

	it("uploads the first image and frames its returned path as a terminal paste", async () => {
		const image = new File(
			[
				"png",
			],
			"clipboard.png",
			{
				type: "image/png",
			},
		);
		pasteImagePost.mockResolvedValue({
			data: {
				path: "/data/terminals/paste/terminal-paste-test/image.png",
			},
			error: null,
		});

		clipboardPasteDispatch(textarea, [
			{
				getAsFile: () => image,
				type: "image/png",
			},
			{
				getAsFile: () => null,
				type: "text/plain",
			},
		]);

		expect(pasteImagePost).toHaveBeenCalledTimes(1);
		expect(pasteImagePost).toHaveBeenCalledWith({
			image,
		});
		expect(clipboardReadText).not.toHaveBeenCalled();
		await tick();

		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "\x1b[200~/data/terminals/paste/terminal-paste-test/image.png\x1b[201~",
			type: "input",
		});
	});

	it("keeps image paste to one marker pair when bracketed mode is active", async () => {
		const instance = terminalInstanceGet(terminalId);
		if (!instance) {
			throw new Error("Expected terminal instance");
		}
		const paste = vi.spyOn(instance.terminal, "paste");
		await new Promise<void>((resolve) => {
			instance.terminal.write("\x1b[?2004h", resolve);
		});
		const image = new File(
			[
				"png",
			],
			"bracketed.png",
			{
				type: "image/png",
			},
		);
		pasteImagePost.mockResolvedValue({
			data: {
				path: "/data/terminals/paste/terminal-paste-test/bracketed.png",
			},
			error: null,
		});

		clipboardPasteDispatch(textarea, [
			{
				getAsFile: () => image,
				type: "image/png",
			},
		]);
		await tick();

		expect(paste).not.toHaveBeenCalled();
		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "\x1b[200~/data/terminals/paste/terminal-paste-test/bracketed.png\x1b[201~",
			type: "input",
		});
	});

	it("routes text-only paste through xterm's paste API", () => {
		const instance = terminalInstanceGet(terminalId);
		if (!instance) {
			throw new Error("Expected terminal instance");
		}
		const paste = vi.spyOn(instance.terminal, "paste");

		clipboardPasteDispatch(
			textarea,
			[
				{
					getAsFile: () => null,
					type: "text/plain",
				},
			],
			"clipboard text",
		);

		expect(pasteImagePost).not.toHaveBeenCalled();
		expect(clipboardReadText).not.toHaveBeenCalled();
		expect(paste).toHaveBeenCalledTimes(1);
		expect(paste).toHaveBeenCalledWith("clipboard text");
		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "clipboard text",
			type: "input",
		});
	});

	it("routes programmatic paste through xterm's paste API", () => {
		const instance = terminalInstanceGet(terminalId);
		if (!instance) {
			throw new Error("Expected terminal instance");
		}
		const paste = vi.spyOn(instance.terminal, "paste");

		terminalInstancePaste(terminalId, "programmatic text");

		expect(paste).toHaveBeenCalledTimes(1);
		expect(paste).toHaveBeenCalledWith("programmatic text");
		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "programmatic text",
			type: "input",
		});
	});
	it("frames transcription text and sends raw enter separately", async () => {
		const instance = terminalInstanceGet(terminalId);
		if (!instance) {
			throw new Error("Expected terminal instance");
		}
		const paste = vi.spyOn(instance.terminal, "paste");

		await new Promise<void>((resolve) => {
			instance.terminal.write("\x1b[?2004h", resolve);
		});
		terminalInstancePaste(terminalId, "first line\nsecond line");
		terminalInstanceInput(terminalId, "\r");

		expect(paste).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledTimes(2);
		expect(websocketSend).toHaveBeenNthCalledWith(1, {
			data: "\x1b[200~first line\rsecond line\x1b[201~",
			type: "input",
		});
		expect(websocketSend).toHaveBeenNthCalledWith(2, {
			data: "\r",
			type: "input",
		});
	});

	it("sends raw control bytes without paste framing", () => {
		terminalInstanceInput(terminalId, "\x03");

		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "\x03",
			type: "input",
		});
	});

	it("delivers a large multiline paste as one complete websocket message", () => {
		const largeText = Array.from(
			{
				length: 400,
			},
			(_, index) => `${index.toString().padStart(3, "0")}:${"x".repeat(28)}`,
		).join("\n");

		terminalInstancePaste(terminalId, largeText);

		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: largeText.replace(/\r?\n/g, "\r"),
			type: "input",
		});
	});

	it("surfaces upload failure without writing to the PTY", async () => {
		pasteImagePost.mockResolvedValue({
			data: null,
			error: {
				value: {
					message: "Image upload failed",
				},
			},
		});
		const image = new File(
			[
				"gif",
			],
			"clipboard.gif",
			{
				type: "image/gif",
			},
		);
		vi.spyOn(console, "error").mockImplementation(() => {});

		clipboardPasteDispatch(textarea, [
			{
				getAsFile: () => image,
				type: "image/gif",
			},
		]);
		await tick();

		expect(websocketSend).not.toHaveBeenCalled();
		expect(clipboardReadText).not.toHaveBeenCalled();
		expect(terminalInstanceGet(terminalId)?.lastError).toBe("Image paste failed: Image upload failed");
	});
});
