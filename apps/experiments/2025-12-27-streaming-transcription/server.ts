import { spawn } from "node:child_process";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
	apiKey: Bun.env.MISTRAL_API_KEY,
});

async function convertToMp3(input: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", [
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
		]);
		const chunks: Buffer[] = [];
		ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
		ffmpeg.stderr.on("data", () => {});
		ffmpeg.on("close", (code) =>
			code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`FFmpeg exit ${code}`)),
		);
		ffmpeg.on("error", reject);
		ffmpeg.stdin.write(input);
		ffmpeg.stdin.end();
	});
}

Bun.serve({
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/") {
			return new Response(Bun.file("./index.html"), {
				headers: {
					"Content-Type": "text/html",
				},
			});
		}

		if (url.pathname === "/transcribe" && req.method === "POST") {
			const formData = await req.formData();
			const audio = formData.get("audio") as File;
			const buffer = Buffer.from(await audio.arrayBuffer());
			const mp3 = await convertToMp3(buffer);
			const base64 = mp3.toString("base64");

			const start = Date.now();
			console.log("[stream] Starting...");

			const stream = await client.chat.stream({
				messages: [
					{
						content: [
							{
								inputAudio: base64,
								type: "input_audio",
							},
							{
								text: "Transcribe exactly. Output only transcription.",
								type: "text",
							},
						],
						role: "user",
					},
				],
				model: "voxtral-small-latest",
			});

			return new Response(
				new ReadableStream({
					async start(controller) {
						let first = true;
						for await (const event of stream) {
							const text = event.data.choices[0]?.delta?.content;
							if (text) {
								if (first) {
									console.log(`[stream] First chunk after ${Date.now() - start}ms: "${text}"`);
									first = false;
								} else {
									console.log(`[stream] +${Date.now() - start}ms: "${text}"`);
								}
								controller.enqueue(new TextEncoder().encode(text));
							}
						}
						console.log(`[stream] Done after ${Date.now() - start}ms`);
						controller.close();
					},
				}),
				{
					headers: {
						"Content-Type": "text/plain; charset=utf-8",
					},
				},
			);
		}

		return new Response("Not found", {
			status: 404,
		});
	},
	port: 3333,
});

console.log("http://localhost:3333");
