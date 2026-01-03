import { treaty } from "@elysiajs/eden";
import type { App } from "./server";

const api = treaty<App>("localhost:3000");
const chat = api.chat.subscribe();

chat.send({
	payload: {
		text: "Valid message",
		timestamp: Date.now(),
	},
	type: "chat",
});

chat.subscribe((event) => {
	const message = "data" in event ? event.data : event;

	console.log(message.type);
	console.log(message.payload.text);
	console.log(message.payload.timestamp);
	console.log(message.payload.serverId);
});
