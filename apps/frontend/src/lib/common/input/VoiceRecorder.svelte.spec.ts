import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import VoiceRecorder from "./VoiceRecorder.component.svelte";
import { VoiceRecorderState } from "./voiceRecorder.lib";

const micLabel = "Click to record";
const micRecordingLabel = "Recording... Click to stop";
const sendLabel = "Stop recording and send";
const saveLabel = "Stop recording and save without transcribing";

describe("VoiceRecorder", () => {
	it("shows only the microphone control when idle", async () => {
		render(VoiceRecorder, {
			state: VoiceRecorderState.Idle,
		});

		await expect
			.element(
				page.getByRole("button", {
					name: micLabel,
				}),
			)
			.toBeInTheDocument();
		await expect
			.element(
				page.getByRole("button", {
					name: sendLabel,
				}),
			)
			.not.toBeInTheDocument();
		await expect
			.element(
				page.getByRole("button", {
					name: saveLabel,
				}),
			)
			.not.toBeInTheDocument();
	});

	it("shows mic, send, and save as separate controls while recording", async () => {
		render(VoiceRecorder, {
			state: VoiceRecorderState.Recording,
		});

		await expect
			.element(
				page.getByRole("button", {
					name: micRecordingLabel,
				}),
			)
			.toBeInTheDocument();
		await expect
			.element(
				page.getByRole("button", {
					name: sendLabel,
				}),
			)
			.toBeInTheDocument();
		await expect
			.element(
				page.getByRole("button", {
					name: saveLabel,
				}),
			)
			.toBeInTheDocument();
	});

	it("invokes only the record callback when the mic control is clicked", async () => {
		const onRecord = vi.fn();
		const onStopAndSend = vi.fn();
		const onStopAndSave = vi.fn();
		render(VoiceRecorder, {
			onpointerdown: onRecord,
			onStopAndSave,
			onStopAndSend,
			state: VoiceRecorderState.Recording,
		});

		await page
			.getByRole("button", {
				name: micRecordingLabel,
			})
			.click();

		expect(onRecord).toHaveBeenCalledTimes(1);
		expect(onStopAndSend).not.toHaveBeenCalled();
		expect(onStopAndSave).not.toHaveBeenCalled();
	});

	it("invokes only the send callback when the send control is clicked", async () => {
		const onRecord = vi.fn();
		const onStopAndSend = vi.fn();
		const onStopAndSave = vi.fn();
		render(VoiceRecorder, {
			onpointerdown: onRecord,
			onStopAndSave,
			onStopAndSend,
			state: VoiceRecorderState.Recording,
		});

		await page
			.getByRole("button", {
				name: sendLabel,
			})
			.click();

		expect(onStopAndSend).toHaveBeenCalledTimes(1);
		expect(onRecord).not.toHaveBeenCalled();
		expect(onStopAndSave).not.toHaveBeenCalled();
	});

	it("invokes only the save callback when the save control is clicked", async () => {
		const onRecord = vi.fn();
		const onStopAndSend = vi.fn();
		const onStopAndSave = vi.fn();
		render(VoiceRecorder, {
			onpointerdown: onRecord,
			onStopAndSave,
			onStopAndSend,
			state: VoiceRecorderState.Recording,
		});

		await page
			.getByRole("button", {
				name: saveLabel,
			})
			.click();

		expect(onStopAndSave).toHaveBeenCalledTimes(1);
		expect(onRecord).not.toHaveBeenCalled();
		expect(onStopAndSend).not.toHaveBeenCalled();
	});
});
