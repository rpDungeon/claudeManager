import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiTerminals, pasteImagePost } = vi.hoisted(() => {
	const pasteImagePostMock = vi.fn();
	return {
		apiTerminals: vi.fn(() => ({
			"paste-image": {
				post: pasteImagePostMock,
			},
		})),
		pasteImagePost: pasteImagePostMock,
	};
});

vi.mock("$lib/api/api.client", () => ({
	api: {
		terminals: apiTerminals,
		ws: {
			terminal: vi.fn(),
		},
	},
	authTokenQueryGet: vi.fn(),
}));

import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import {
	terminalInstanceCreate,
	terminalInstanceDestroy,
	terminalInstanceGet,
	terminalInstanceMount,
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

describe("terminal image paste", () => {
	let container: HTMLDivElement;
	let textarea: HTMLTextAreaElement;
	let websocketSend = vi.fn();
	let clipboardReadText = vi.fn();

	beforeEach(() => {
		pasteImagePost.mockReset();
		apiTerminals.mockClear();
		websocketSend = vi.fn();
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
		const instance = terminalInstanceCreate(terminalId);
		instance.websocket = {
			send: websocketSend,
		} as never;
		terminalInstanceMount(terminalId, container);
		const mountedTextarea = container.querySelector("textarea.xterm-helper-textarea");
		if (!(mountedTextarea instanceof HTMLTextAreaElement)) {
			throw new Error("Expected xterm helper textarea");
		}
		textarea = mountedTextarea;
	});

	afterEach(() => {
		const instance = terminalInstanceGet(terminalId);
		if (instance) instance.websocket = null;
		terminalInstanceDestroy(terminalId);
		container.remove();
		vi.restoreAllMocks();
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

	it("keeps text-only paste on the clipboard text path", async () => {
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
		await tick();

		expect(pasteImagePost).not.toHaveBeenCalled();
		expect(clipboardReadText).not.toHaveBeenCalled();
		expect(websocketSend).toHaveBeenCalledTimes(1);
		expect(websocketSend).toHaveBeenCalledWith({
			data: "clipboard text",
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
