import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";

export const terminalPasteImageMaxBytes = 10 * 1024 * 1024;

const TERMINAL_DATA_DIR = resolve(Bun.env.TERMINAL_DATA_DIR);
const TERMINAL_PASTE_DIRECTORY = resolve(TERMINAL_DATA_DIR, "paste");

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
	"image/gif": ".gif",
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

type TerminalPasteImageResult =
	| {
			ok: true;
			data: {
				path: string;
			};
	  }
	| {
			ok: false;
			error: string;
			status: 400 | 500;
	  };

function terminalPasteDirectoryGet(terminalId: TerminalId): string {
	const safeTerminalId = terminalId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return resolve(TERMINAL_PASTE_DIRECTORY, safeTerminalId);
}

export async function terminalPasteImageCreate(terminalId: TerminalId, image: File): Promise<TerminalPasteImageResult> {
	const extension = IMAGE_EXTENSION_BY_MIME_TYPE[image.type];
	if (!extension) {
		return {
			error: "Unsupported image type",
			ok: false,
			status: 400,
		};
	}

	if (image.size > terminalPasteImageMaxBytes) {
		return {
			error: `Image too large (max ${terminalPasteImageMaxBytes} bytes)`,
			ok: false,
			status: 400,
		};
	}

	const imageBuffer = Buffer.from(await image.arrayBuffer());
	if (imageBuffer.byteLength > terminalPasteImageMaxBytes) {
		return {
			error: `Image too large (max ${terminalPasteImageMaxBytes} bytes)`,
			ok: false,
			status: 400,
		};
	}

	const pasteDirectory = terminalPasteDirectoryGet(terminalId);
	const path = resolve(pasteDirectory, `${randomUUID()}${extension}`);

	try {
		await mkdir(pasteDirectory, {
			recursive: true,
		});
		await writeFile(path, imageBuffer, {
			flag: "wx",
		});
	} catch {
		return {
			error: "Failed to save image",
			ok: false,
			status: 500,
		};
	}

	return {
		data: {
			path,
		},
		ok: true,
	};
}

export async function terminalPasteImagesDelete(terminalId: TerminalId): Promise<void> {
	try {
		await rm(terminalPasteDirectoryGet(terminalId), {
			force: true,
			recursive: true,
		});
	} catch (error) {
		console.error(`[Terminal] Failed to delete pasted images for ${terminalId}:`, error);
	}
}
