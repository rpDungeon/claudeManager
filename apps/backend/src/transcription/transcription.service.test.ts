import { describe, expect, it } from "bun:test";

import { transcriptionTextIsPathological } from "./transcription.service";

describe("transcription response validation", () => {
	it("rejects repeated sentence loops", () => {
		expect(transcriptionTextIsPathological("Yeah, quite a push. ".repeat(8))).toBe(true);
	});

	it("accepts normal transcription text", () => {
		expect(
			transcriptionTextIsPathological(
				"Create an objective, let the implementation agent update it, and let a review agent verify the result.",
			),
		).toBe(false);
	});

	it("rejects implausibly long text for tiny source audio", () => {
		expect(transcriptionTextIsPathological("context hallucination ".repeat(40), 20_000)).toBe(true);
	});
});
