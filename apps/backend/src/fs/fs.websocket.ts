import {
	FsWatchMessageClientType,
	FsWatchMessageServerType,
	fsWatchMessageClientSchema,
	fsWatchMessageServerSchema,
} from "@claude-manager/common/src/fs/fs.types";
import { Elysia } from "elysia";

import { fsService } from "./fs.service";

type WsId = string;
type WatchPath = string;
type Unsubscribe = () => void;

const fsClientWatchers = new Map<WsId, Map<WatchPath, Unsubscribe>>();

export const fsWatchWebsocket = new Elysia({
	prefix: "/ws",
}).ws("/fs/watch", {
	body: fsWatchMessageClientSchema,

	close(ws) {
		const watchers = fsClientWatchers.get(ws.id);
		if (watchers) {
			for (const unsubscribe of watchers.values()) {
				unsubscribe();
			}
			fsClientWatchers.delete(ws.id);
		}
	},

	async message(ws, message) {
		let watchers = fsClientWatchers.get(ws.id);
		if (!watchers) {
			watchers = new Map();
			fsClientWatchers.set(ws.id, watchers);
		}

		if (message.type === FsWatchMessageClientType.Watch) {
			if (watchers.has(message.path)) {
				return;
			}

			const unsubscribe = await fsService.watchStart(message.path, message.recursive ?? false, (serverMessage) => {
				ws.send(serverMessage);
			});

			watchers.set(message.path, unsubscribe);
		} else if (message.type === FsWatchMessageClientType.Unwatch) {
			const unsubscribe = watchers.get(message.path);
			if (unsubscribe) {
				unsubscribe();
				watchers.delete(message.path);
				ws.send({
					path: message.path,
					type: FsWatchMessageServerType.Unwatched,
				});
			}
		}
	},

	open(ws) {
		fsClientWatchers.set(ws.id, new Map());
	},

	response: fsWatchMessageServerSchema,
});
