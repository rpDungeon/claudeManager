import { systemStatsMessageSchema } from "@claude-manager/common/src/system/system.types";
import { Elysia } from "elysia";

import { systemService } from "./system.service";

const STATS_INTERVAL_MS = 500;

const intervalMap = new Map<string, ReturnType<typeof setInterval>>();

export const systemWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/system/stats", {
	close(ws) {
		const interval = intervalMap.get(ws.id);
		if (interval) {
			clearInterval(interval);
			intervalMap.delete(ws.id);
		}
	},

	open(ws) {
		const sendStats = () => {
			const stats = systemService.statsGet();
			ws.send({
				...stats,
				type: "stats" as const,
			});
		};

		sendStats();

		const interval = setInterval(sendStats, STATS_INTERVAL_MS);
		intervalMap.set(ws.id, interval);
	},

	response: systemStatsMessageSchema,
});
