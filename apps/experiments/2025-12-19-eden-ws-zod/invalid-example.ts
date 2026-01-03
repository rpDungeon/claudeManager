import { treaty } from "@elysiajs/eden";
import type { App } from "./server";

const api = treaty<App>("localhost:3000");
const chat = api.chat.subscribe();

chat.send({
	payload: {
		text: "This should fail type checking",
		timestamp: Date.now(),
	},
	type: "invalid",
});

chat.send({
	payload: {
		wrongField: "This should also fail",
	},
	type: "chat",
});

chat.send({
	payload: "String instead of object",
	type: "chat",
});
