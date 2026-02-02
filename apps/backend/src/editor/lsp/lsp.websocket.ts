import {
	type EditorLspLanguageId,
	EditorLspMessageServerType,
	editorLspMessageClientSchema,
	editorLspMessageServerSchema,
} from "@claude-manager/common/src/editor/lsp.types";
import { Elysia } from "elysia";
import { z } from "zod";
import { editorLspService } from "./lsp.service";

const unsubscribeMap = new Map<string, () => void>();

const PING_INTERVAL_MS = 30_000;
const MAX_MISSED_PINGS = 2;

type KeepaliveState = {
	interval: ReturnType<typeof setInterval>;
	missedPings: number;
};
const keepaliveMap = new Map<string, KeepaliveState>();

type SessionState = {
	rootUri: string;
	languageId: EditorLspLanguageId;
};
const sessionMap = new Map<string, SessionState>();

export const editorLspWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/lsp/:sessionId", {
	body: editorLspMessageClientSchema,

	close(ws) {
		const unsubscribe = unsubscribeMap.get(ws.id);
		if (unsubscribe) {
			unsubscribe();
			unsubscribeMap.delete(ws.id);
		}

		const keepalive = keepaliveMap.get(ws.id);
		if (keepalive) {
			clearInterval(keepalive.interval);
			keepaliveMap.delete(ws.id);
		}

		sessionMap.delete(ws.id);
	},

	message(ws, message) {
		if (message.type === "pong") {
			const keepalive = keepaliveMap.get(ws.id);
			if (keepalive) {
				keepalive.missedPings = 0;
			}
			return;
		}

		const session = sessionMap.get(ws.id);

		if (message.type === "initialize") {
			if (session) {
				ws.send({
					message: "Session already initialized",
					type: EditorLspMessageServerType.Error,
				});
				return;
			}

			const { rootUri, languageId } = message;

			sessionMap.set(ws.id, {
				languageId,
				rootUri,
			});

			let instance = editorLspService.instanceGet(rootUri, languageId);

			if (!instance) {
				instance = editorLspService.instanceSpawn(rootUri, languageId);
			}

			const unsubscribe = instance.onMessage((jsonRpcContent) => {
				ws.send({
					content: jsonRpcContent,
					type: EditorLspMessageServerType.JsonRpc,
				});
			});
			unsubscribeMap.set(ws.id, unsubscribe);

			ws.send({
				type: EditorLspMessageServerType.Ready,
			});

			return;
		}

		if (message.type === "jsonrpc") {
			if (!session) {
				ws.send({
					message: "Session not initialized. Send initialize message first.",
					type: EditorLspMessageServerType.Error,
				});
				return;
			}

			const instance = editorLspService.instanceGet(session.rootUri, session.languageId);
			if (!instance) {
				ws.send({
					message: "Language server not running",
					type: EditorLspMessageServerType.Error,
				});
				return;
			}

			instance.sendRaw(message.content);
		}
	},

	open(ws) {
		const interval = setInterval(() => {
			const keepalive = keepaliveMap.get(ws.id);
			if (!keepalive) {
				clearInterval(interval);
				return;
			}

			keepalive.missedPings++;

			if (keepalive.missedPings >= MAX_MISSED_PINGS) {
				console.log(`[LSP WS] Closing connection ${ws.id} - ${keepalive.missedPings} missed pings`);
				clearInterval(interval);
				keepaliveMap.delete(ws.id);
				ws.close();
				return;
			}

			ws.send({
				type: EditorLspMessageServerType.Ping,
			});
		}, PING_INTERVAL_MS);

		keepaliveMap.set(ws.id, {
			interval,
			missedPings: 0,
		});
	},

	params: z.object({
		sessionId: z.string(),
	}),
	response: editorLspMessageServerSchema,
});
