import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { transcriptionRoutes } from "./transcription.routes";
import { transcriptionService } from "./transcription.service";

const app = new Elysia().use(transcriptionRoutes);

const SAMPLE_AUDIO_URL = "https://docs.mistral.ai/audio/obama.mp3";

describe("transcription service", () => {
	it("transcribes audio from base64", async () => {
		const response = await fetch(SAMPLE_AUDIO_URL);
		const arrayBuffer = await response.arrayBuffer();
		const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

		const transcription = await transcriptionService.transcriptionFromBase64(audioBase64);

		expect(typeof transcription).toBe("string");
		expect(transcription.length).toBeGreaterThan(0);
	}, 120_000);
});

describe("transcription routes", () => {
	describe("POST /transcription", () => {
		it("returns 422 when no audio file is provided", async () => {
			const response = await app.handle(
				new Request("http://localhost/transcription", {
					body: new FormData(),
					method: "POST",
				}),
			);

			expect(response.status).toBe(422);
		});

		it("transcribes an audio file successfully", async () => {
			const audioResponse = await fetch(SAMPLE_AUDIO_URL);
			const audioBlob = await audioResponse.blob();
			const audioFile = new File(
				[
					audioBlob,
				],
				"obama.mp3",
				{
					type: "audio/mp3",
				},
			);

			const formData = new FormData();
			formData.append("audio", audioFile);

			const response = await app.handle(
				new Request("http://localhost/transcription", {
					body: formData,
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty("transcription");
			expect(typeof data.transcription).toBe("string");
			expect(data.transcription.length).toBeGreaterThan(0);
		}, 120_000);

		it("accepts language parameter", async () => {
			const audioResponse = await fetch(SAMPLE_AUDIO_URL);
			const audioBlob = await audioResponse.blob();
			const audioFile = new File(
				[
					audioBlob,
				],
				"obama.mp3",
				{
					type: "audio/mp3",
				},
			);

			const formData = new FormData();
			formData.append("audio", audioFile);
			formData.append("language", "en");

			const response = await app.handle(
				new Request("http://localhost/transcription", {
					body: formData,
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty("transcription");
			expect(data.transcription.length).toBeGreaterThan(0);
		}, 120_000);
	});
});
