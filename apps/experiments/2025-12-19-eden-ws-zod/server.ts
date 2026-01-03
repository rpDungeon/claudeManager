import { Elysia } from "elysia";
import { z } from "zod";

const messageSchema = z.object({
	payload: z.object({
		text: z.string(),
		timestamp: z.number(),
	}),
	type: z.enum([
		"chat",
		"ping",
		"command",
	]),
});

const responseSchema = z.object({
	payload: z.object({
		serverId: z.string(),
		text: z.string(),
		timestamp: z.number(),
	}),
	type: z.enum([
		"chat",
		"pong",
		"result",
	]),
});

const app = new Elysia()
	.ws("/chat", {
		body: messageSchema,

		close(ws) {
			console.log("Client disconnected:", ws.id);
		},

		message(ws, message) {
			console.log("Received message:", message);

			if (message.type === "ping") {
				ws.send({
					payload: {
						serverId: "server-001",
						text: "Pong!",
						timestamp: Date.now(),
					},
					type: "pong",
				});
			} else if (message.type === "chat") {
				ws.publish("chat-room", {
					payload: {
						serverId: "server-001",
						text: `[${ws.id}]: ${message.payload.text}`,
						timestamp: Date.now(),
					},
					type: "chat",
				});
			} else if (message.type === "command") {
				ws.send({
					payload: {
						serverId: "server-001",
						text: `Executed: ${message.payload.text}`,
						timestamp: Date.now(),
					},
					type: "result",
				});
			}
		},

		open(ws) {
			console.log("Client connected:", ws.id);
			ws.subscribe("chat-room");

			ws.send({
				payload: {
					serverId: "server-001",
					text: `Welcome! Your ID is ${ws.id}`,
					timestamp: Date.now(),
				},
				type: "chat",
			});
		},
		response: responseSchema,
	})
	.get("/", () => ({
		endpoint: "/chat",
		message: "WebSocket server is running",
	}))
	.listen(3000);

console.log(`Server listening on ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
