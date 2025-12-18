import process from "node:process";
import { type IPty, spawn } from "@homebridge/node-pty-prebuilt-multiarch";

const HTML_FILE = Bun.file("./index.html");

interface WsData {
	id: string;
	pty: IPty | null;
}

const server = Bun.serve({
	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === "/ws") {
			const upgraded = server.upgrade(req, {
				data: {
					id: crypto.randomUUID(),
					pty: null,
				} as WsData,
			});
			if (!upgraded) {
				return new Response("WebSocket upgrade failed", {
					status: 400,
				});
			}
			return;
		}

		if (url.pathname === "/" || url.pathname === "/index.html") {
			return new Response(HTML_FILE, {
				headers: {
					"Content-Type": "text/html",
				},
			});
		}

		return new Response("Not Found", {
			status: 404,
		});
	},
	port: 3456,

	websocket: {
		close(ws) {
			const data = ws.data as WsData;
			if (data.pty) {
				try {
					data.pty.kill();
				} catch {
					// Already dead
				}
				console.log(`[${data.id.slice(0, 8)}] Terminal closed`);
				data.pty = null;
			}
		},

		message(ws, message) {
			const data = ws.data as WsData;
			const pty = data.pty;

			try {
				const msg = JSON.parse(message.toString());

				switch (msg.type) {
					case "input":
						if (pty) {
							pty.write(msg.data);
						}
						break;

					case "resize":
						if (pty && msg.cols > 0 && msg.rows > 0) {
							try {
								pty.resize(msg.cols, msg.rows);
								console.log(`[${data.id.slice(0, 8)}] Resized: ${msg.cols}x${msg.rows}`);
							} catch (e) {
								console.error(`[${data.id.slice(0, 8)}] Resize failed:`, e);
							}
						}
						break;
				}
			} catch (e) {
				console.error("Failed to parse message:", e);
			}
		},
		open(ws) {
			const data = ws.data as WsData;
			const shell = process.env.SHELL || "/bin/bash";

			try {
				const pty = spawn(
					shell,
					[
						"-il",
					],
					{
						cols: 80,
						cwd: process.env.HOME || "/tmp",
						env: {
							...process.env,
							COLORTERM: "truecolor",
							LANG: "en_US.UTF-8",
							LC_ALL: "en_US.UTF-8",
							TERM: "xterm-256color",
						},
						name: "xterm-256color",
						rows: 24,
					},
				);

				data.pty = pty;

				pty.onData((output) => {
					try {
						ws.send(
							JSON.stringify({
								data: output,
								type: "output",
							}),
						);
					} catch {
						// Connection closed
					}
				});

				pty.onExit(({ exitCode, signal }) => {
					console.log(`[${data.id.slice(0, 8)}] PTY exited: code=${exitCode} signal=${signal}`);
					try {
						ws.send(
							JSON.stringify({
								exitCode,
								type: "exit",
							}),
						);
					} catch {
						// Already closed
					}
					data.pty = null;
				});

				console.log(`[${data.id.slice(0, 8)}] Terminal spawned: ${shell} -il`);
			} catch (err) {
				console.error(`[${data.id.slice(0, 8)}] Failed to spawn:`, err);
				ws.send(
					JSON.stringify({
						message: String(err),
						type: "error",
					}),
				);
				ws.close();
			}
		},
	},
});

console.log(`xterm.js PTY server running at http://localhost:${server.port}`);
