import { Mistral } from "@mistralai/mistralai";

const TRANSCRIPTION_MODEL_ID = "voxtral-mini-latest";
const LEGACY_MODEL_ID = "voxtral-small-latest";

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

async function audioConvertToMp3(inputBuffer: Buffer): Promise<Buffer> {
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

	const output = await new Response(proc.stdout).arrayBuffer();
	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		throw new Error(`FFmpeg exited with code ${exitCode}`);
	}

	return Buffer.from(output);
}

class TranscriptionService {
	private client: Mistral;

	constructor() {
		this.client = new Mistral({
			apiKey: Bun.env.MISTRAL_API_KEY,
		});
	}

	private get useLegacy(): boolean {
		return Bun.env.TRANSCRIPTION_USE_LEGACY === "true";
	}

	async transcriptionFromBuffer(audioBuffer: Buffer, language?: string): Promise<string> {
		const mp3Buffer = await audioConvertToMp3(audioBuffer);

		if (this.useLegacy) {
			return this.transcriptionLegacyChat(mp3Buffer.toString("base64"), language);
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
			language: language ?? undefined,
			model: TRANSCRIPTION_MODEL_ID,
			temperature: 0.1,
		});

		if (!response.text) {
			throw new Error("Failed to get transcription response");
		}

		return response.text;
	}

	private async transcriptionLegacyChat(audioBase64: string, language?: string): Promise<string> {
		let prompt = `Transcribe this audio exactly as spoken.
The speaker has a German accent speaking English. Interpret phonetically ambiguous words in context.
Common topics: programming, software development, terminal commands, Claude AI, git, TypeScript, Svelte.`;
		if (language) {
			prompt += ` The audio is in ${language}.`;
		}
		prompt += " Output only the transcription, no additional commentary.";

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
	}
}

export const transcriptionService = new TranscriptionService();
