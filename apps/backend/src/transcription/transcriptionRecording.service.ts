import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import {
	type TranscriptionRecording,
	TranscriptionRecordingStatus,
	transcriptionRecordingSchema,
} from "@claude-manager/common/src/transcription/transcription.types";

function transcriptionRecordingsDirectoryGet(): string {
	return Bun.env.TRANSCRIPTION_RECORDINGS_DIR
		? resolve(Bun.env.TRANSCRIPTION_RECORDINGS_DIR)
		: resolve(Bun.env.TERMINAL_DATA_DIR, "..", "transcription", "recordings");
}

function transcriptionRecordingDirectoryGet(recordingId: string): string {
	return resolve(transcriptionRecordingsDirectoryGet(), recordingId);
}

function transcriptionRecordingMetadataPathGet(recordingId: string): string {
	return resolve(transcriptionRecordingDirectoryGet(recordingId), "metadata.json");
}

function transcriptionRecordingExtensionGet(audio: File): string {
	const extension = extname(audio.name)
		.toLowerCase()
		.replace(/[^a-z0-9.]/g, "");
	if (extension) return extension;
	if (audio.type.includes("webm")) return ".webm";
	if (audio.type.includes("mp4")) return ".mp4";
	if (audio.type.includes("mpeg") || audio.type.includes("mp3")) return ".mp3";
	if (audio.type.includes("ogg")) return ".ogg";
	if (audio.type.includes("wav")) return ".wav";
	return ".bin";
}

function transcriptionRecordingMetadataWrite(recording: TranscriptionRecording): void {
	const metadataPath = transcriptionRecordingMetadataPathGet(recording.id);
	const temporaryPath = `${metadataPath}.${randomUUID()}.tmp`;
	writeFileSync(temporaryPath, JSON.stringify(recording, null, 2));
	renameSync(temporaryPath, metadataPath);
}

export function transcriptionRecordingGet(recordingId: string): TranscriptionRecording | undefined {
	const metadataPath = transcriptionRecordingMetadataPathGet(recordingId);
	if (!existsSync(metadataPath)) return undefined;
	try {
		const parsed = transcriptionRecordingSchema.safeParse(JSON.parse(readFileSync(metadataPath, "utf8")));
		return parsed.success ? parsed.data : undefined;
	} catch {
		return undefined;
	}
}

export function transcriptionRecordingCreate(
	audioBuffer: Buffer,
	audio: File,
	terminalId?: TerminalId,
	language?: string,
	initialStatus: TranscriptionRecordingStatus = TranscriptionRecordingStatus.Processing,
): TranscriptionRecording {
	const createdAt = new Date().toISOString();
	const id = randomUUID();
	const recordingDirectory = transcriptionRecordingDirectoryGet(id);
	const audioFileName = `transcription-${createdAt.replace(/[:.]/g, "-")}${transcriptionRecordingExtensionGet(audio)}`;
	mkdirSync(recordingDirectory, {
		recursive: true,
	});
	writeFileSync(resolve(recordingDirectory, audioFileName), audioBuffer);
	const recording: TranscriptionRecording = {
		audioFileName,
		createdAt,
		error: null,
		id,
		language: language ?? null,
		mimeType: audio.type || "application/octet-stream",
		sizeBytes: audioBuffer.length,
		status: initialStatus,
		terminalId: terminalId ?? null,
		transcription: null,
		updatedAt: createdAt,
	};
	transcriptionRecordingMetadataWrite(recording);
	return recording;
}

export function transcriptionRecordingList(terminalId?: TerminalId, limit = 100): TranscriptionRecording[] {
	const recordingsDirectory = transcriptionRecordingsDirectoryGet();
	if (!existsSync(recordingsDirectory)) return [];
	return readdirSync(recordingsDirectory, {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.map((entry) => transcriptionRecordingGet(entry.name))
		.filter((recording): recording is TranscriptionRecording => Boolean(recording))
		.filter((recording) => !terminalId || recording.terminalId === terminalId)
		.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
		.slice(0, Math.max(1, Math.min(limit, 500)));
}

export function transcriptionRecordingAudioGet(recordingId: string):
	| {
			path: string;
			recording: TranscriptionRecording;
	  }
	| undefined {
	const recording = transcriptionRecordingGet(recordingId);
	if (!recording) return undefined;
	const path = resolve(transcriptionRecordingDirectoryGet(recordingId), recording.audioFileName);
	if (!existsSync(path)) return undefined;
	return {
		path,
		recording,
	};
}

export function transcriptionRecordingProcessingSet(recordingId: string): TranscriptionRecording | undefined {
	const recording = transcriptionRecordingGet(recordingId);
	if (!recording) return undefined;
	const updated = {
		...recording,
		error: null,
		status: TranscriptionRecordingStatus.Processing,
		updatedAt: new Date().toISOString(),
	};
	transcriptionRecordingMetadataWrite(updated);
	return updated;
}

export function transcriptionRecordingCompleteSet(
	recordingId: string,
	transcription: string,
): TranscriptionRecording | undefined {
	const recording = transcriptionRecordingGet(recordingId);
	if (!recording) return undefined;
	const updated = {
		...recording,
		error: null,
		status: TranscriptionRecordingStatus.Complete,
		transcription,
		updatedAt: new Date().toISOString(),
	};
	transcriptionRecordingMetadataWrite(updated);
	return updated;
}

export function transcriptionRecordingFailureSet(
	recordingId: string,
	error: string,
): TranscriptionRecording | undefined {
	const recording = transcriptionRecordingGet(recordingId);
	if (!recording) return undefined;
	const updated = {
		...recording,
		error,
		status: TranscriptionRecordingStatus.Failed,
		updatedAt: new Date().toISOString(),
	};
	transcriptionRecordingMetadataWrite(updated);
	return updated;
}
