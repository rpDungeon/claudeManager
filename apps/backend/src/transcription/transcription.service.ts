import { Mistral } from "@mistralai/mistralai";

const MODEL_ID = "voxtral-small-latest";

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

	async transcriptionFromBase64(audioBase64: string, language?: string): Promise<string> {
		let prompt = `Transcribe this audio exactly as spoken.
The speaker has a German accent speaking English. Interpret phonetically ambiguous words in context.
Common topics: programming, software development, terminal commands, Claude AI, git, TypeScript, Svelte.`;
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
					model: MODEL_ID,
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

	async transcriptionFromBuffer(audioBuffer: Buffer, language?: string): Promise<string> {
		const mp3Buffer = await audioConvertToMp3(audioBuffer);
		const audioBase64 = mp3Buffer.toString("base64");
		return this.transcriptionFromBase64(audioBase64, language);
	}
}

export const transcriptionService = new TranscriptionService();
