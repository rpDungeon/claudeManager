import { Elysia } from "elysia";
import { z } from "zod";

import { transcriptionService } from "./transcription.service";

const transcriptionBody = z.object({
	audio: z.instanceof(File),
	language: z.string().optional(),
});

const transcriptionResponse = z.object({
	transcription: z.string(),
});

const transcriptionError = z.object({
	error: z.string(),
});

export const transcriptionRoutes = new Elysia({
	prefix: "/transcription",
}).post(
	"/",
	async ({ body, status }) => {
		try {
			const audioBuffer = Buffer.from(await body.audio.arrayBuffer());
			const language = body.language ?? undefined;

			console.log(`[Transcription] Processing ${(audioBuffer.length / 1024).toFixed(1)}KB audio`);

			const transcription = await transcriptionService.transcriptionFromBuffer(audioBuffer, language);

			return {
				transcription,
			};
		} catch (error) {
			console.error("[Transcription] Error:", error);
			const message = error instanceof Error ? error.message : "Transcription failed";

			if (message.includes("429") || message.includes("rate limit")) {
				return status("Too Many Requests", {
					error: "Rate limit exceeded. Try shorter recordings or wait a moment.",
				});
			}

			return status("Internal Server Error", {
				error: message,
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
