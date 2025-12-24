import {
	TerminalPtyMessageServerType,
	terminalPtyMessageClientSchema,
	terminalPtyMessageServerSchema,
} from "@claude-manager/common/src/terminal/pty.types";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";
import { terminalPtyService } from "./pty.service";

const unsubscribeMap = new Map<string, () => void>();

export const terminalPtyWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/terminal/:terminalId", {
	body: terminalPtyMessageClientSchema,

	close(ws) {
		const { terminalId } = ws.data.params;
		const unsubscribe = unsubscribeMap.get(ws.id);
		if (unsubscribe) {
			unsubscribe();
			unsubscribeMap.delete(ws.id);
		}
		terminalPtyService.instanceKill(terminalId);
	},

	message(ws, message) {
		const { terminalId } = ws.data.params;
		const instance = terminalPtyService.instanceGet(terminalId);

		if (!instance) {
			ws.send({
				message: "Terminal not running",
				type: TerminalPtyMessageServerType.Error,
			});
			return;
		}

		if (message.type === "input") {
			instance.write(message.data);
		} else if (message.type === "resize") {
			instance.resize(message.cols, message.rows);
		}
	},

	async open(ws) {
		const { terminalId } = ws.data.params;

		const terminal = await db.query.terminal.findFirst({
			where: eq(terminalSchema.id, terminalId),
			with: {
				project: true,
			},
		});

		if (!terminal) {
			ws.send({
				message: "Terminal not found",
				type: TerminalPtyMessageServerType.Error,
			});
			ws.close();
			return;
		}

		const instance = terminalPtyService.instanceSpawn(terminalId, terminal.project.path);

		const unsubscribe = instance.onData((message) => {
			ws.send(message);
		});

		unsubscribeMap.set(ws.id, unsubscribe);
	},
	params: z.object({
		terminalId: terminalIdSchema,
	}),
	response: terminalPtyMessageServerSchema,
});
