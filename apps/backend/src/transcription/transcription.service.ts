import { Mistral } from "@mistralai/mistralai";

const TRANSCRIPTION_MODEL_ID = "voxtral-mini-latest";
const LEGACY_MODEL_ID = "voxtral-small-latest";
const TRANSCRIPTION_MAX_CHARACTERS = 50_000;
const TRANSCRIPTION_MAX_CHARACTERS_PER_SOURCE_BYTE = 0.025;
const TRANSCRIPTION_MIN_DYNAMIC_MAX_CHARACTERS = 500;
const TRANSCRIPTION_REPEATED_SENTENCE_LIMIT = 8;
const TRANSCRIPTION_SENTENCE_SPLIT_REGEX = /[.!?]+/;
const TRANSCRIPTION_WHITESPACE_REGEX = /\s+/g;
const TRANSCRIPTION_MAX_VOLUME_REGEX = /max_volume:\s*(-?\d+(?:\.\d+)?) dB/;
const TRANSCRIPTION_SILENCE_MAX_DB = -60;

const CONTEXT_BIAS_TERMS = [
	"Claude",
	"TypeScript",
	"Svelte",
	"SvelteKit",
	"Bun",
	"ElysiaJS",
	"Drizzle",
	"xterm",
	"paneforge",
	"git",
	"npm",
	"FFmpeg",
	"WebSocket",
	"PTY",
	"SQLite",
	"Tailwind",
];

export function transcriptionTextIsPathological(transcription: string, sourceAudioSizeBytes?: number): boolean {
	if (transcription.length > TRANSCRIPTION_MAX_CHARACTERS) return true;
	if (
		sourceAudioSizeBytes &&
		transcription.length >
			Math.max(
				TRANSCRIPTION_MIN_DYNAMIC_MAX_CHARACTERS,
				sourceAudioSizeBytes * TRANSCRIPTION_MAX_CHARACTERS_PER_SOURCE_BYTE,
			)
	) {
		return true;
	}
	const sentences = transcription
		.toLowerCase()
		.split(TRANSCRIPTION_SENTENCE_SPLIT_REGEX)
		.map((sentence) => sentence.trim().replace(TRANSCRIPTION_WHITESPACE_REGEX, " "))
		.filter((sentence) => sentence.length > 0);
	let repeatedSentenceCount = 1;
	for (let index = 1; index < sentences.length; index++) {
		if (sentences[index] === sentences[index - 1]) {
			repeatedSentenceCount++;
			if (repeatedSentenceCount >= TRANSCRIPTION_REPEATED_SENTENCE_LIMIT) return true;
		} else {
			repeatedSentenceCount = 1;
		}
	}
	return false;
}

async function audioConvertToMp3(inputBuffer: Buffer): Promise<Buffer> {
	if (inputBuffer.length === 0) {
		throw new Error("Empty audio buffer received");
	}

	if (inputBuffer.length < 100) {
		throw new Error(`Audio buffer too small: ${inputBuffer.length} bytes`);
	}

	const proc = Bun.spawn(
		[
			"ffmpeg",
			"-i",
			"pipe:0",
			"-f",
			"mp3",
			"-acodec",
			"libmp3lame",
			"-ab",
			"128k",
			"-ar",
			"44100",
			"-af",
			"volumedetect",
			"pipe:1",
		],
		{
			stderr: "pipe",
			stdin: "pipe",
			stdout: "pipe",
		},
	);

	proc.stdin.write(inputBuffer);
	proc.stdin.end();

	const [output, stderrData, exitCode] = await Promise.all([
		new Response(proc.stdout).arrayBuffer(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	if (exitCode !== 0) {
		throw new Error(`FFmpeg exited with code ${exitCode}: ${stderrData.slice(0, 500)}`);
	}
	const maxVolumeMatch = stderrData.match(TRANSCRIPTION_MAX_VOLUME_REGEX);
	if (maxVolumeMatch && Number.parseFloat(maxVolumeMatch[1]) <= TRANSCRIPTION_SILENCE_MAX_DB) {
		throw new Error("Recording contains no audible audio");
	}

	const mp3Buffer = Buffer.from(output);
	if (mp3Buffer.length === 0) {
		throw new Error("FFmpeg produced empty output");
	}

	return mp3Buffer;
}

class TranscriptionService {
	private client: Mistral;

	constructor() {
		this.client = new Mistral({
			apiKey: Bun.env.MISTRAL_API_KEY,
		});
	}

	private get useLegacy(): boolean {
		return Bun.env.TRANSCRIPTION_USE_LEGACY !== "false";
	}

	async transcriptionFromBuffer(audioBuffer: Buffer, language?: string): Promise<string> {
		const mp3Buffer = await audioConvertToMp3(audioBuffer);

		if (this.useLegacy) {
			let transcription: string;
			const audioBase64 = mp3Buffer.toString("base64");
			try {
				transcription = await this.transcriptionLegacyChat(audioBase64, language);
			} catch (error) {
				console.error("[Transcription] Legacy failed, falling back to transcription endpoint:", error);
				return this.transcriptionEndpoint(mp3Buffer, language);
			}
			if (!transcriptionTextIsPathological(transcription, audioBuffer.length)) return transcription;
			console.error("[Transcription] Legacy response was pathological, retrying without context bias");
			try {
				const minimalTranscription = await this.transcriptionLegacyChat(audioBase64, language, false);
				if (!transcriptionTextIsPathological(minimalTranscription, audioBuffer.length)) return minimalTranscription;
			} catch (error) {
				console.error("[Transcription] Minimal legacy retry failed:", error);
			}
			return this.transcriptionEndpoint(mp3Buffer, language);
		}

		return this.transcriptionEndpoint(mp3Buffer, language);
	}

	private async transcriptionEndpoint(mp3Buffer: Buffer, language?: string): Promise<string> {
		const file = new File(
			[
				new Uint8Array(mp3Buffer),
			],
			"audio.mp3",
			{
				type: "audio/mpeg",
			},
		);

		const response = await this.client.audio.transcriptions.complete({
			contextBias: CONTEXT_BIAS_TERMS,
			file,
			language: language ?? "en",
			model: TRANSCRIPTION_MODEL_ID,
			temperature: 0.1,
		});

		if (!response.text) {
			throw new Error("Failed to get transcription response");
		}
		if (transcriptionTextIsPathological(response.text)) {
			throw new Error("Transcription response was pathologically repetitive");
		}

		return response.text;
	}

	private async transcriptionLegacyChat(
		audioBase64: string,
		language?: string,
		includeContextBias = true,
	): Promise<string> {
		let prompt = includeContextBias
			? `Transcribe this audio exactly as spoken.
The speaker is a native German speaker with a strong accent speaking English in a programming context.
Phonetically ambiguous words should be interpreted as programming terms when plausible (e.g. "commit", "component", "comment", "command" may sound similar).
Common vocabulary: git, commit, push, pull, merge, branch, rebase, TypeScript, Svelte, SvelteKit, Bun, ElysiaJS, Drizzle, xterm, paneforge, WebSocket, PTY, SQLite, Tailwind, Claude, FFmpeg, npm, API, endpoint, schema, router, service, middleware, terminal, transcription.`
			: "Transcribe this audio exactly as spoken. Output only words that are clearly audible.";
		if (language) {
			prompt += ` The audio is in ${language}.`;
		}
		prompt += " Output only the transcription, no additional commentary.";

		const maxRetries = 3;
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const response = await this.client.chat.complete({
					messages: [
						{
							content: [
								{
									inputAudio: audioBase64,
									type: "input_audio",
								},
								{
									text: prompt,
									type: "text",
								},
							],
							role: "user",
						},
					],
					model: LEGACY_MODEL_ID,
					temperature: 0.1,
				});

				const message = response.choices?.[0]?.message;
				if (!message || typeof message.content !== "string") {
					throw new Error("Failed to get transcription response");
				}

				return message.content;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				const isRateLimit = lastError.message.includes("429") || lastError.message.includes("rate limit");

				if (isRateLimit && attempt < maxRetries - 1) {
					console.log(`[Transcription] Rate limited, retrying in 1s (attempt ${attempt + 1}/${maxRetries})`);
					await new Promise((resolve) => setTimeout(resolve, 1000));
					continue;
				}

				throw lastError;
			}
		}

		throw lastError ?? new Error("Transcription failed after retries");
	}
}

export const transcriptionService = new TranscriptionService();
