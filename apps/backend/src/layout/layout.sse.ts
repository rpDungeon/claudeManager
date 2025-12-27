import { layoutIdSchema } from "@claude-manager/common/src/layout/layout.id";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import type { Layout } from "@claude-manager/common/src/layout/layout.types";
import { eq } from "drizzle-orm";
import { Elysia, sse } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";
import { layoutService } from "./layout.service";

const HEARTBEAT_INTERVAL_MS = 30_000;

type QueueItem =
	| {
			type: "update";
			layout: Layout;
	  }
	| {
			type: "heartbeat";
	  };

export const layoutSse = new Elysia({
	prefix: "/layouts",
}).get(
	"/:id/stream",
	async function* ({ params, status }) {
		const layout = await db.query.layout.findFirst({
			where: eq(layoutSchema.id, params.id),
		});

		if (!layout) {
			return status(404, {
				message: "Layout not found",
			});
		}

		yield sse({
			data: layout,
			event: "initial",
		});

		const queue: QueueItem[] = [];
		let resolveNext: (() => void) | null = null;

		const enqueue = (item: QueueItem) => {
			queue.push(item);
			if (resolveNext) {
				resolveNext();
				resolveNext = null;
			}
		};

		const unsubscribe = layoutService.subscribe(params.id, (updatedLayout) => {
			enqueue({
				layout: updatedLayout,
				type: "update",
			});
		});

		const heartbeatInterval = setInterval(() => {
			enqueue({
				type: "heartbeat",
			});
		}, HEARTBEAT_INTERVAL_MS);

		try {
			while (true) {
				if (queue.length === 0) {
					await new Promise<void>((resolve) => {
						resolveNext = resolve;
					});
				}

				const item = queue.shift();
				if (!item) continue;

				if (item.type === "update") {
					yield sse({
						data: item.layout,
						event: "update",
					});
				} else {
					yield sse({
						event: "heartbeat",
					});
				}
			}
		} finally {
			clearInterval(heartbeatInterval);
			unsubscribe();
		}
	},
	{
		params: z.object({
			id: layoutIdSchema,
		}),
	},
);
