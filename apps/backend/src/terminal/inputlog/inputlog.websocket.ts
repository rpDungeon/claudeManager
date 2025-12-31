import { terminalInputLogSchema } from "@claude-manager/common/src/terminal/terminal.inputlog.schema";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import {
	TerminalInputLogWsMessageType,
	terminalInputLogWsMessageServerSchema,
} from "@claude-manager/common/src/terminal/terminalInputLog.ws.types";
import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";
import { terminalInputlogService } from "./inputlog.service";

const HEARTBEAT_INTERVAL_MS = 30_000;

const unsubscribeMap = new Map<string, () => void>();
const heartbeatMap = new Map<string, ReturnType<typeof setInterval>>();

export const terminalInputlogWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/terminal/:terminalId/input-logs", {
	close(ws) {
		const unsubscribe = unsubscribeMap.get(ws.id);
		if (unsubscribe) {
			unsubscribe();
			unsubscribeMap.delete(ws.id);
		}

		const heartbeat = heartbeatMap.get(ws.id);
		if (heartbeat) {
			clearInterval(heartbeat);
			heartbeatMap.delete(ws.id);
		}
	},

	async open(ws) {
		const { terminalId } = ws.data.params;

		const existingLogs = await db
			.select()
			.from(terminalInputLogSchema)
			.where(eq(terminalInputLogSchema.terminalId, terminalId))
			.orderBy(desc(terminalInputLogSchema.timestamp))
			.limit(100);

		ws.send({
			logs: existingLogs.reverse(),
			type: TerminalInputLogWsMessageType.Initial,
		});

		const unsubscribe = terminalInputlogService.subscribe(terminalId, (log) => {
			ws.send({
				log,
				type: TerminalInputLogWsMessageType.New,
			});
		});

		unsubscribeMap.set(ws.id, unsubscribe);

		const heartbeat = setInterval(() => {
			ws.send({
				type: TerminalInputLogWsMessageType.Heartbeat,
			});
		}, HEARTBEAT_INTERVAL_MS);

		heartbeatMap.set(ws.id, heartbeat);
	},

	params: z.object({
		terminalId: terminalIdSchema,
	}),

	response: terminalInputLogWsMessageServerSchema,
});
