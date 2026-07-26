import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import { TranscriptionRecordingStatus } from "@claude-manager/common/src/transcription/transcription.types";
import { Elysia } from "elysia";

import { transcriptionRoutes } from "./transcription.routes";
import { transcriptionService } from "./transcription.service";
import {
	transcriptionRecordingAudioGet,
	transcriptionRecordingCompleteSet,
	transcriptionRecordingCreate,
	transcriptionRecordingFailureSet,
	transcriptionRecordingList,
	transcriptionRecordingProcessingSet,
} from "./transcriptionRecording.service";

let recordingsDirectory = "";

beforeEach(() => {
	recordingsDirectory = mkdtempSync(resolve(tmpdir(), "claude-manager-transcription-"));
	Bun.env.TRANSCRIPTION_RECORDINGS_DIR = recordingsDirectory;
});

afterEach(() => {
	rmSync(recordingsDirectory, {
		force: true,
		recursive: true,
	});
	Bun.env.TRANSCRIPTION_RECORDINGS_DIR = undefined;
});

describe("transcription recording service", () => {
	it("persists raw audio and metadata", () => {
		const terminalId = terminalIdSchema.parse("terminal:test");
		const audioBytes = Buffer.from("raw-audio-data");
		const audio = new File(
			[
				audioBytes,
			],
			"recording.webm",
			{
				type: "audio/webm",
			},
		);

		const recording = transcriptionRecordingCreate(audioBytes, audio, terminalId, "en");
		const storedAudio = transcriptionRecordingAudioGet(recording.id);

		expect(recording.status).toBe(TranscriptionRecordingStatus.Processing);
		expect(recording.terminalId).toBe(terminalId);
		expect(storedAudio).toBeDefined();
		expect(readFileSync(storedAudio?.path ?? "")).toEqual(audioBytes);
		expect(transcriptionRecordingList(terminalId)).toEqual([
			recording,
		]);
	});

	it("tracks regeneration state without deleting audio", () => {
		const audioBytes = Buffer.from("raw-audio-data");
		const recording = transcriptionRecordingCreate(
			audioBytes,
			new File(
				[
					audioBytes,
				],
				"recording.mp4",
				{
					type: "audio/mp4",
				},
			),
		);

		const failed = transcriptionRecordingFailureSet(recording.id, "provider failed");
		const processing = transcriptionRecordingProcessingSet(recording.id);
		const complete = transcriptionRecordingCompleteSet(recording.id, "Recovered transcription");

		expect(failed?.status).toBe(TranscriptionRecordingStatus.Failed);
		expect(failed?.error).toBe("provider failed");
		expect(processing?.status).toBe(TranscriptionRecordingStatus.Processing);
		expect(complete?.status).toBe(TranscriptionRecordingStatus.Complete);
		expect(complete?.transcription).toBe("Recovered transcription");
		expect(readFileSync(transcriptionRecordingAudioGet(recording.id)?.path ?? "")).toEqual(audioBytes);
	});

	it("stores, lists, downloads, and regenerates through the API", async () => {
		const originalTranscriptionFromBuffer = transcriptionService.transcriptionFromBuffer;
		let transcription = "Initial transcription";
		transcriptionService.transcriptionFromBuffer = async () => transcription;
		try {
			const app = new Elysia().use(transcriptionRoutes);
			const terminalId = terminalIdSchema.parse("terminal:api-test");
			const audioBytes = Buffer.from("raw-api-audio");
			const body = new FormData();
			body.append(
				"audio",
				new File(
					[
						audioBytes,
					],
					"recording.webm",
					{
						type: "audio/webm",
					},
				),
			);
			body.append("terminalId", terminalId);

			const createResponse = await app.handle(
				new Request("http://localhost/transcription", {
					body,
					method: "POST",
				}),
			);
			const created = await createResponse.json();

			expect(createResponse.status).toBe(200);
			expect(created.transcription).toBe("Initial transcription");
			expect(created.recording.terminalId).toBe(terminalId);

			const listResponse = await app.handle(
				new Request(`http://localhost/transcription?terminalId=${encodeURIComponent(terminalId)}`),
			);
			const recordings = await listResponse.json();
			expect(recordings).toHaveLength(1);
			expect(recordings[0].id).toBe(created.recording.id);

			const audioResponse = await app.handle(
				new Request(`http://localhost/transcription/${created.recording.id}/audio`),
			);
			expect(Buffer.from(await audioResponse.arrayBuffer())).toEqual(audioBytes);

			transcription = "Regenerated transcription";
			const regenerateResponse = await app.handle(
				new Request(`http://localhost/transcription/${created.recording.id}/regenerate`, {
					method: "POST",
				}),
			);
			const regenerated = await regenerateResponse.json();
			expect(regenerated.transcription).toBe("Regenerated transcription");
			expect(readFileSync(transcriptionRecordingAudioGet(created.recording.id)?.path ?? "")).toEqual(audioBytes);
		} finally {
			transcriptionService.transcriptionFromBuffer = originalTranscriptionFromBuffer;
		}
	});
});
