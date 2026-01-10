import {
	TerminalPtyMessageServerType,
	terminalPtyMessageClientSchema,
	terminalPtyMessageServerSchema,
} from "@claude-manager/common/src/terminal/pty.types";
import { terminalInputLogSchema } from "@claude-manager/common/src/terminal/terminal.inputlog.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";
import { terminalInputlogService } from "../inputlog/inputlog.service";
import { terminalPtyService } from "./pty.service";

const unsubscribeMap = new Map<string, () => void>();
const inputBufferMap = new Map<TerminalId, string>();
const escapeStateMap = new Map<TerminalId, boolean>();
const processPollingMap = new Map<string, ReturnType<typeof setInterval>>();
const lastProcessMap = new Map<string, string | null>();

const PROCESS_POLL_INTERVAL_MS = 1000;
const PING_INTERVAL_MS = 5000;
const MAX_MISSED_PINGS = 2;

type KeepaliveState = {
	interval: ReturnType<typeof setInterval>;
	missedPings: number;
};
const keepaliveMap = new Map<string, KeepaliveState>();

function inputBufferProcess(terminalId: TerminalId, data: string) {
	let buffer = inputBufferMap.get(terminalId) ?? "";
	let inEscape = escapeStateMap.get(terminalId) ?? false;

	for (const char of data) {
		const code = char.charCodeAt(0);

		if (char === "\x1b") {
			inEscape = true;
			continue;
		}

		if (inEscape) {
			if ((code >= 0x40 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
				inEscape = false;
			}
			continue;
		}

		if (char === "\r" || char === "\n") {
			if (buffer.trim().length > 0) {
				const inserted = db
					.insert(terminalInputLogSchema)
					.values({
						input: buffer,
						terminalId,
					})
					.returning()
					.get();

				if (inserted) {
					terminalInputlogService.publish(inserted);
				}
			}
			buffer = "";
		} else if (char === "\x7f") {
			buffer = buffer.slice(0, -1);
		} else if (char === "\x03") {
			buffer = "";
		} else if (char >= " " || char === "\t") {
			buffer += char;
		}
	}

	inputBufferMap.set(terminalId, buffer);
	escapeStateMap.set(terminalId, inEscape);
}

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

		const processPolling = processPollingMap.get(ws.id);
		if (processPolling) {
			clearInterval(processPolling);
			processPollingMap.delete(ws.id);
		}
		lastProcessMap.delete(ws.id);

		const keepalive = keepaliveMap.get(ws.id);
		if (keepalive) {
			clearInterval(keepalive.interval);
			keepaliveMap.delete(ws.id);
		}

		inputBufferMap.delete(terminalId);
		escapeStateMap.delete(terminalId);
	},

	message(ws, message) {
		if (message.type === "pong") {
			const keepalive = keepaliveMap.get(ws.id);
			if (keepalive) {
				keepalive.missedPings = 0;
			}
			return;
		}

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
			inputBufferProcess(terminalId, message.data);
		} else if (message.type === "resize") {
			instance.resize(message.cols, message.rows);
		}
	},

	async open(ws) {
		const { terminalId } = ws.data.params;
		console.log(`[WS] Terminal connection opened: ${terminalId}`);

		const setupKeepalive = () => {
			const interval = setInterval(() => {
				const keepalive = keepaliveMap.get(ws.id);
				if (!keepalive) {
					clearInterval(interval);
					return;
				}

				keepalive.missedPings++;

				if (keepalive.missedPings >= MAX_MISSED_PINGS) {
					console.log(`[WS] Closing connection ${ws.id} - ${keepalive.missedPings} missed pings`);
					clearInterval(interval);
					keepaliveMap.delete(ws.id);
					ws.close();
					return;
				}

				ws.send({
					type: TerminalPtyMessageServerType.Ping,
				});
			}, PING_INTERVAL_MS);

			keepaliveMap.set(ws.id, {
				interval,
				missedPings: 0,
			});
		};

		const setupProcessPolling = (ptyInstance: ReturnType<typeof terminalPtyService.instanceGet>) => {
			if (!ptyInstance) return;

			const currentProcess = ptyInstance.foregroundProcessGet();
			lastProcessMap.set(ws.id, currentProcess);
			ws.send({
				process: currentProcess,
				type: TerminalPtyMessageServerType.ForegroundProcess,
			});

			const polling = setInterval(() => {
				const inst = terminalPtyService.instanceGet(terminalId);
				if (!inst) {
					clearInterval(polling);
					processPollingMap.delete(ws.id);
					return;
				}

				const newProcess = inst.foregroundProcessGet();
				const lastProcess = lastProcessMap.get(ws.id);

				if (newProcess !== lastProcess) {
					lastProcessMap.set(ws.id, newProcess);
					ws.send({
						process: newProcess,
						type: TerminalPtyMessageServerType.ForegroundProcess,
					});
				}
			}, PROCESS_POLL_INTERVAL_MS);

			processPollingMap.set(ws.id, polling);
		};

		const existingInstance = terminalPtyService.instanceGet(terminalId);
		console.log(`[WS] Existing instance for ${terminalId}:`, Boolean(existingInstance));
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
			setupProcessPolling(existingInstance);
			setupKeepalive();
			return;
		}

		const terminal = await db.query.terminal.findFirst({
			where: eq(terminalSchema.id, terminalId),
			with: {
				project: true,
			},
		});

		if (!terminal) {
			console.log(`[WS] Terminal not found in DB: ${terminalId}`);
			ws.send({
				message: "Terminal not found",
				type: TerminalPtyMessageServerType.Error,
			});
			ws.close();
			return;
		}

		console.log(`[WS] Terminal found, project path: ${terminal.project.path}`);
		const instance = terminalPtyService.instanceSpawn(terminalId, terminal.project.path);

		const unsubscribe = instance.onData((message) => {
			ws.send(message);
		});

		unsubscribeMap.set(ws.id, unsubscribe);
		setupProcessPolling(instance);
		setupKeepalive();
	},
	params: z.object({
		terminalId: terminalIdSchema,
	}),
	response: terminalPtyMessageServerSchema,
});
