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
import { terminalPtyInstanceKill, terminalPtyInstanceSpawn } from "./pty.service";

export const terminalPtyWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/terminal/:terminalId", {
	// Schema definitions for Eden type inference
	body: terminalPtyMessageClientSchema,

	close(ws) {
		const { terminalId } = ws.data.params;
		terminalPtyInstanceKill(terminalId);
	},

	async message(ws, message) {
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
			return;
		}

		const instance = terminalPtyInstanceSpawn(terminalId, terminal.project.path);

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

		const instance = terminalPtyInstanceSpawn(terminalId, terminal.project.path);

		instance.onData((message) => {
			ws.send(message);
		});
	},
	params: z.object({
		terminalId: terminalIdSchema,
	}),
	response: terminalPtyMessageServerSchema,
});
