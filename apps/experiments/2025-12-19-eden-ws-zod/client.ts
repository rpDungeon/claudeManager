import { treaty } from "@elysiajs/eden";
import type { App } from "./server";

const api = treaty<App>("localhost:3000");

console.log("Connecting to WebSocket...");

const chat = api.chat.subscribe();

chat.subscribe((event) => {
	const message = "data" in event ? event.data : event;

	console.log("Received (typed):", {
		serverId: message.payload.serverId,
		text: message.payload.text,
		timestamp: new Date(message.payload.timestamp).toISOString(),
		type: message.type,
	});
});

chat.on("open", () => {
	console.log("Connected to server!");

	console.log("\nSending ping...");
	chat.send({
		payload: {
			text: "Ping from client",
			timestamp: Date.now(),
		},
		type: "ping",
	});

	setTimeout(() => {
		console.log("\nSending chat message...");
		chat.send({
			payload: {
				text: "Hello from TypeScript client!",
				timestamp: Date.now(),
			},
			type: "chat",
		});
	}, 1000);

	setTimeout(() => {
		console.log("\nSending command...");
		chat.send({
			payload: {
				text: "status",
				timestamp: Date.now(),
			},
			type: "command",
		});
	}, 2000);

	setTimeout(() => {
		console.log("\n--- Type Safety Test ---");
		console.log("The following would cause TypeScript errors:");
		console.log('1. Sending invalid type: chat.send({ type: "invalid", ... })');
		console.log('2. Missing required field: chat.send({ type: "chat" })');
		console.log('3. Wrong payload structure: chat.send({ type: "chat", payload: "string" })');
		console.log("\nAll messages are fully typed based on Zod schemas!");

		setTimeout(() => {
			console.log("\nClosing connection...");
			chat.close();
			process.exit(0);
		}, 1000);
	}, 3000);
});

chat.on("error", (error) => {
	console.error("WebSocket error:", error);
});

chat.on("close", () => {
	console.log("Disconnected from server");
});
