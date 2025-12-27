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

			const transcription = await transcriptionService.transcriptionFromBuffer(audioBuffer, language);

			return {
				transcription,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Transcription failed";
			return status(500, {
				error: message,
			});
		}
	},
	{
		body: transcriptionBody,
		response: {
			200: transcriptionResponse,
			500: transcriptionError,
		},
	},
);
