import { readFileSync } from "node:fs";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import {
	type TranscriptionRecording,
	transcriptionRecordingSchema,
} from "@claude-manager/common/src/transcription/transcription.types";
import { Elysia } from "elysia";
import { z } from "zod";

import { transcriptionService } from "./transcription.service";
import {
	transcriptionRecordingAudioGet,
	transcriptionRecordingCompleteSet,
	transcriptionRecordingCreate,
	transcriptionRecordingFailureSet,
	transcriptionRecordingList,
	transcriptionRecordingProcessingSet,
} from "./transcriptionRecording.service";

const transcriptionBody = z.object({
	audio: z.instanceof(File),
	language: z.string().optional(),
	terminalId: terminalIdSchema.optional(),
});

const transcriptionResponse = z.object({
	recording: transcriptionRecordingSchema,
	transcription: z.string(),
});

const transcriptionError = z.object({
	error: z.string(),
	recording: transcriptionRecordingSchema.optional(),
});

function transcriptionErrorMessageGet(error: unknown): string {
	return error instanceof Error ? error.message : "Transcription failed";
}

function transcriptionErrorIsRateLimit(message: string): boolean {
	return message.includes("429") || message.toLowerCase().includes("rate limit");
}

export const transcriptionRoutes = new Elysia({
	prefix: "/transcription",
})
	.get("/", ({ query }) => transcriptionRecordingList(query.terminalId, query.limit), {
		query: z.object({
			limit: z.coerce.number().optional(),
			terminalId: terminalIdSchema.optional(),
		}),
	})
	.get(
		"/:recordingId/audio",
		({ params, set, status }) => {
			const audio = transcriptionRecordingAudioGet(params.recordingId);
			if (!audio) {
				return status("Not Found", {
					error: "Recording audio not found",
				});
			}
			set.headers["content-disposition"] = `attachment; filename="${audio.recording.audioFileName}"`;
			set.headers["content-type"] = audio.recording.mimeType;
			return Bun.file(audio.path);
		},
		{
			params: z.object({
				recordingId: z.string().uuid(),
			}),
		},
	)
	.post(
		"/:recordingId/regenerate",
		async ({ params, status }) => {
			const audio = transcriptionRecordingAudioGet(params.recordingId);
			if (!audio) {
				return status("Not Found", {
					error: "Recording audio not found",
				});
			}

			transcriptionRecordingProcessingSet(params.recordingId);
			try {
				const transcription = await transcriptionService.transcriptionFromBuffer(
					readFileSync(audio.path),
					audio.recording.language ?? undefined,
				);
				const recording = transcriptionRecordingCompleteSet(params.recordingId, transcription);
				if (!recording) {
					return status("Internal Server Error", {
						error: "Recording metadata not found",
					});
				}
				return {
					recording,
					transcription,
				};
			} catch (error) {
				const message = transcriptionErrorMessageGet(error);
				const recording = transcriptionRecordingFailureSet(params.recordingId, message);
				if (transcriptionErrorIsRateLimit(message)) {
					return status("Too Many Requests", {
						error: "Rate limit exceeded. Try again later.",
						recording,
					});
				}
				return status("Internal Server Error", {
					error: message,
					recording,
				});
			}
		},
		{
			params: z.object({
				recordingId: z.string().uuid(),
			}),
			response: {
				200: transcriptionResponse,
				404: transcriptionError,
				429: transcriptionError,
				500: transcriptionError,
			},
		},
	)
	.post(
		"/",
		async ({ body, status }) => {
			let recording: TranscriptionRecording | undefined;
			try {
				const audioBuffer = Buffer.from(await body.audio.arrayBuffer());
				recording = transcriptionRecordingCreate(audioBuffer, body.audio, body.terminalId, body.language);
				console.log(`[Transcription] Processing ${(audioBuffer.length / 1024).toFixed(1)}KB audio as ${recording.id}`);
				const transcription = await transcriptionService.transcriptionFromBuffer(audioBuffer, body.language);
				const completedRecording = transcriptionRecordingCompleteSet(recording.id, transcription);
				if (!completedRecording) {
					throw new Error("Recording metadata not found");
				}
				return {
					recording: completedRecording,
					transcription,
				};
			} catch (error) {
				console.error("[Transcription] Error:", error);
				const message = transcriptionErrorMessageGet(error);
				const failedRecording = recording ? transcriptionRecordingFailureSet(recording.id, message) : undefined;
				if (transcriptionErrorIsRateLimit(message)) {
					return status("Too Many Requests", {
						error: "Rate limit exceeded. Try shorter recordings or wait a moment.",
						recording: failedRecording,
					});
				}
				return status("Internal Server Error", {
					error: message,
					recording: failedRecording,
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
