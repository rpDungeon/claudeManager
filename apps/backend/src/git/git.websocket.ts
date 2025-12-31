import {
	GitWatchMessageClientType,
	GitWatchMessageServerType,
	gitWatchMessageClientSchema,
	gitWatchMessageServerSchema,
} from "@claude-manager/common/src/git/git.types";
import { Elysia } from "elysia";

import { gitService } from "./git.service";

type WsId = string;
type RepoPath = string;
type Unsubscribe = () => void;

const gitClientWatchers = new Map<WsId, Map<RepoPath, Unsubscribe>>();

export const gitWatchWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/git/watch", {
	body: gitWatchMessageClientSchema,

	close(ws) {
		const watchers = gitClientWatchers.get(ws.id);
		if (watchers) {
			for (const unsubscribe of watchers.values()) {
				unsubscribe();
			}
			gitClientWatchers.delete(ws.id);
		}
	},

	async message(ws, message) {
		let watchers = gitClientWatchers.get(ws.id);
		if (!watchers) {
			watchers = new Map();
			gitClientWatchers.set(ws.id, watchers);
		}

		if (message.type === GitWatchMessageClientType.Watch) {
			if (watchers.has(message.path)) {
				return;
			}

			const unsubscribe = await gitService.watchStart(message.path, (serverMessage) => {
				ws.send(serverMessage);
			});

			watchers.set(message.path, unsubscribe);
		} else if (message.type === GitWatchMessageClientType.Unwatch) {
			const unsubscribe = watchers.get(message.path);
			if (unsubscribe) {
				unsubscribe();
				watchers.delete(message.path);
				ws.send({
					path: message.path,
					type: GitWatchMessageServerType.Unwatched,
				});
			}
		}
	},

	open(ws) {
		gitClientWatchers.set(ws.id, new Map());
	},

	response: gitWatchMessageServerSchema,
});
