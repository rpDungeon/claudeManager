import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

import { Elysia } from "elysia";
import { z } from "zod";

import { transcriptionService } from "./transcription.service";

const TRANSCRIPTION_FAILED_DIR = resolve(Bun.env.TERMINAL_DATA_DIR, "..", "transcription", "failed");

const transcriptionBody = z.object({
	audio: z.instanceof(File),
	language: z.string().optional(),
});

const transcriptionResponse = z.object({
	transcription: z.string(),
});

const transcriptionError = z.object({
	error: z.string(),
	failedRecordingPath: z.string().optional(),
});

function transcriptionFailureExtensionGet(audio: File): string {
	const extension = extname(audio.name)
		.toLowerCase()
		.replace(/[^a-z0-9.]/g, "");
	if (extension) return extension;

	if (audio.type === "audio/webm") return ".webm";
	if (audio.type === "audio/mp4") return ".mp4";
	if (audio.type === "audio/mpeg" || audio.type === "audio/mp3") return ".mp3";
	if (audio.type === "audio/wav") return ".wav";

	return ".bin";
}

function transcriptionFailureSave(
	audioBuffer: Buffer,
	audio: File,
	language: string | undefined,
	error: unknown,
): string | undefined {
	try {
		const createdAt = new Date();
		const folderName = `${createdAt.toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
		const folderPath = resolve(TRANSCRIPTION_FAILED_DIR, folderName);
		const audioPath = resolve(folderPath, `audio${transcriptionFailureExtensionGet(audio)}`);
		const metadataPath = resolve(folderPath, "metadata.json");
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorName = error instanceof Error ? error.name : undefined;
		const errorStack = error instanceof Error ? error.stack : undefined;

		mkdirSync(folderPath, {
			recursive: true,
		});
		writeFileSync(audioPath, audioBuffer);
		writeFileSync(
			metadataPath,
			JSON.stringify(
				{
					audio: {
						fileName: audio.name,
						mimeType: audio.type,
						path: audioPath,
						sizeBytes: audioBuffer.length,
					},
					createdAt: createdAt.toISOString(),
					error: {
						message: errorMessage,
						name: errorName,
						stack: errorStack,
					},
					language: language ?? null,
				},
				null,
				2,
			),
		);

		console.log(`[Transcription] Failed recording saved to ${folderPath}`);
		return folderPath;
	} catch (saveError) {
		console.error("[Transcription] Failed to save failed recording:", saveError);
		return undefined;
	}
}

export const transcriptionRoutes = new Elysia({
	prefix: "/transcription",
}).post(
	"/",
	async ({ body, status }) => {
		let audioBuffer: Buffer | undefined;
		let language: string | undefined;

		try {
			audioBuffer = Buffer.from(await body.audio.arrayBuffer());
			language = body.language ?? undefined;

			console.log(`[Transcription] Processing ${(audioBuffer.length / 1024).toFixed(1)}KB audio`);

			const transcription = await transcriptionService.transcriptionFromBuffer(audioBuffer, language);

			return {
				transcription,
			};
		} catch (error) {
			console.error("[Transcription] Error:", error);
			const failedRecordingPath = audioBuffer
				? transcriptionFailureSave(audioBuffer, body.audio, language, error)
				: undefined;
			const message = error instanceof Error ? error.message : "Transcription failed";

			if (message.includes("429") || message.includes("rate limit")) {
				return status("Too Many Requests", {
					error: "Rate limit exceeded. Try shorter recordings or wait a moment.",
					failedRecordingPath,
				});
			}

			return status("Internal Server Error", {
				error: message,
				failedRecordingPath,
			});
		}
	},
	{
		body: transcriptionBody,
		response: {
			200: transcriptionResponse,
			429: transcriptionError,
			500: transcriptionError,
		},
	},
);
