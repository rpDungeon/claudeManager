import { layoutIdSchema } from "@claude-manager/common/src/layout/layout.id";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";
import { layoutService } from "./layout.service";

const HEARTBEAT_INTERVAL_MS = 30_000;

const unsubscribeMap = new Map<string, () => void>();
const heartbeatMap = new Map<string, ReturnType<typeof setInterval>>();

export const layoutWs = new Elysia({
	prefix: "/ws",
}).ws("/layout/:layoutId", {
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
		const { layoutId } = ws.data.params;

		const layout = await db.query.layout.findFirst({
			where: eq(layoutSchema.id, layoutId),
		});

		if (!layout) {
			ws.send({
				error: "Layout not found",
				type: "error",
			});
			ws.close();
			return;
		}

		ws.send({
			layout,
			type: "initial",
		});

		const unsubscribe = layoutService.subscribe(layoutId, (updatedLayout) => {
			ws.send({
				layout: updatedLayout,
				type: "update",
			});
		});

		unsubscribeMap.set(ws.id, unsubscribe);

		const heartbeat = setInterval(() => {
			ws.send({
				type: "heartbeat",
			});
		}, HEARTBEAT_INTERVAL_MS);

		heartbeatMap.set(ws.id, heartbeat);
	},

	params: z.object({
		layoutId: layoutIdSchema,
	}),
});
