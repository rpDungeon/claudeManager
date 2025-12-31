import {
	TerminalPtyMessageServerType,
	terminalPtyMessageClientSchema,
	terminalPtyMessageServerSchema,
} from "@claude-manager/common/src/terminal/pty.types";
import { terminalInputLogSchema } from "@claude-manager/common/src/terminal/terminal.inputlog.schema";
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
		const unsubscribe = unsubscribeMap.get(ws.id);
		if (unsubscribe) {
			unsubscribe();
			unsubscribeMap.delete(ws.id);
		}
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

			db.insert(terminalInputLogSchema)
				.values({
					input: message.data,
					terminalId,
				})
				.run();
		} else if (message.type === "resize") {
			instance.resize(message.cols, message.rows);
		}
	},

	async open(ws) {
		const { terminalId } = ws.data.params;

		const existingInstance = terminalPtyService.instanceGet(terminalId);
		if (existingInstance) {
			const scrollback = existingInstance.getScrollback();
			if (scrollback) {
				ws.send({
					data: scrollback,
					type: TerminalPtyMessageServerType.Output,
				});
			}

			const unsubscribe = existingInstance.onData((message) => {
				ws.send(message);
			});

			unsubscribeMap.set(ws.id, unsubscribe);
			return;
		}

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
