import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";
import { terminalPtyInstanceKill, terminalPtyInstanceSpawn } from "./pty.service";
import {
	TerminalPtyMessageServerType,
	terminalPtyMessageClientSchema,
	terminalPtyMessageServerSchema,
} from "./pty.types";

export const terminalPtyWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/terminal/:terminalId", {
	close(ws) {
		const terminalId = terminalIdSchema.safeParse(ws.data.params.terminalId);
		if (terminalId.success) {
			terminalPtyInstanceKill(terminalId.data);
		}
	},

	async message(ws, message) {
		const terminalId = terminalIdSchema.safeParse(ws.data.params.terminalId);
		if (!terminalId.success) {
			ws.send({
				message: "Invalid terminal ID",
				type: TerminalPtyMessageServerType.Error,
			});
			return;
		}

		const parsed = terminalPtyMessageClientSchema.safeParse(message);
		if (!parsed.success) {
			ws.send({
				message: "Invalid message format",
				type: TerminalPtyMessageServerType.Error,
			});
			return;
		}

		const terminal = await db.query.terminal.findFirst({
			where: eq(terminalSchema.id, terminalId.data),
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

		const instance = terminalPtyInstanceSpawn(terminalId.data, terminal.project.path);

		if (parsed.data.type === "input") {
			instance.write(parsed.data.data);
		} else if (parsed.data.type === "resize") {
			instance.resize(parsed.data.cols, parsed.data.rows);
		}
	},

	async open(ws) {
		const terminalId = terminalIdSchema.safeParse(ws.data.params.terminalId);
		if (!terminalId.success) {
			ws.send({
				message: "Invalid terminal ID",
				type: TerminalPtyMessageServerType.Error,
			});
			ws.close();
			return;
		}

		const terminal = await db.query.terminal.findFirst({
			where: eq(terminalSchema.id, terminalId.data),
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

		const instance = terminalPtyInstanceSpawn(terminalId.data, terminal.project.path);

		instance.onData((message) => {
			ws.send(message);
		});
	},

	params: z.object({
		terminalId: z.string(),
	}),

	response: terminalPtyMessageServerSchema,
});
