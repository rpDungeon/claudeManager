import { z } from "zod";

import { terminalIdSchema } from "../terminal/terminal.types";

export enum TranscriptionRecordingStatus {
	Complete = "complete",
	Failed = "failed",
	Processing = "processing",
}

export const transcriptionRecordingSchema = z.object({
	audioFileName: z.string(),
	createdAt: z.string(),
	error: z.string().nullable(),
	id: z.string().uuid(),
	language: z.string().nullable(),
	mimeType: z.string(),
	sizeBytes: z.number(),
	status: z.nativeEnum(TranscriptionRecordingStatus),
	terminalId: terminalIdSchema.nullable(),
	transcription: z.string().nullable(),
	updatedAt: z.string(),
});

export type TranscriptionRecording = z.infer<typeof transcriptionRecordingSchema>;
