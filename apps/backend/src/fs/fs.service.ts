import * as nodefs from "node:fs";
import * as nodefsPromises from "node:fs/promises";
import * as path from "node:path";
import { fsMaxFileSize } from "@claude-manager/common/src/fs/fs.config";
import {
	type FsEntry,
	FsEntryType,
	type FsReadResponse,
	FsWatchEventType,
	type FsWatchMessageServer,
	FsWatchMessageServerType,
} from "@claude-manager/common/src/fs/fs.types";

type Unsubscribe = () => void;
type FsWatchCallback = (message: FsWatchMessageServer) => void;

type FsWatcherState = {
	callbacks: Set<FsWatchCallback>;
	dirPath: string;
	recursive: boolean;
	watcher: nodefs.FSWatcher;
};

type FsReadResult =
	| {
			ok: true;
			data: FsReadResponse;
	  }
	| {
			ok: false;
			error: string;
			status: 400 | 403 | 404;
	  };

function fsEntryFromStats(filePath: string, stats: nodefs.Stats): FsEntry {
	return {
		modifiedAt: stats.mtime.getTime(),
		name: path.basename(filePath),
		path: filePath,
		size: stats.size,
		type: stats.isDirectory() ? FsEntryType.Directory : FsEntryType.File,
	};
}

async function fsEntryFromPath(filePath: string): Promise<FsEntry | null> {
	try {
		const stats = await nodefsPromises.stat(filePath);
		return fsEntryFromStats(filePath, stats);
	} catch {
		return null;
	}
}

async function fsDirEntries(dirPath: string): Promise<FsEntry[]> {
	const names = await nodefsPromises.readdir(dirPath);
	const entries: FsEntry[] = [];

	for (const name of names) {
		const entryPath = path.join(dirPath, name);
		const entry = await fsEntryFromPath(entryPath);
		if (entry) {
			entries.push(entry);
		}
	}

	entries.sort((a, b) => {
		if (a.type !== b.type) {
			return a.type === FsEntryType.Directory ? -1 : 1;
		}
		return a.name.localeCompare(b.name);
	});

	return entries;
}

class FsService {
	private watchers = new Map<string, FsWatcherState>();

	async read(targetPath: string): Promise<FsReadResult> {
		try {
			const stats = await nodefsPromises.stat(targetPath);

			if (stats.isDirectory()) {
				const entries = await fsDirEntries(targetPath);
				return {
					data: {
						entries,
						path: targetPath,
						type: FsEntryType.Directory,
					},
					ok: true,
				};
			}

			if (stats.size > fsMaxFileSize) {
				return {
					error: `File too large (max ${fsMaxFileSize} bytes)`,
					ok: false,
					status: 400,
				};
			}

			const buffer = await nodefsPromises.readFile(targetPath);
			const content = buffer.toString("base64");

			return {
				data: {
					content,
					modifiedAt: stats.mtime.getTime(),
					path: targetPath,
					size: stats.size,
					type: FsEntryType.File,
				},
				ok: true,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return {
					error: "Path not found",
					ok: false,
					status: 404,
				};
			}
			if (code === "EACCES") {
				return {
					error: "Permission denied",
					ok: false,
					status: 403,
				};
			}
			throw err;
		}
	}

	private watcherKeyCreate(dirPath: string, recursive: boolean): string {
		return `${dirPath}:${recursive}`;
	}

	async watchStart(dirPath: string, recursive: boolean, callback: FsWatchCallback): Promise<Unsubscribe> {
		const key = this.watcherKeyCreate(dirPath, recursive);
		let state = this.watchers.get(key);

		if (state) {
			state.callbacks.add(callback);
		} else {
			const callbacks = new Set<FsWatchCallback>();
			callbacks.add(callback);

			try {
				const watcher = nodefs.watch(
					dirPath,
					{
						recursive,
					},
					(eventType, filename) => {
						if (!filename) return;

						const changedPath = path.join(dirPath, filename);
						const event = eventType === "rename" ? FsWatchEventType.Rename : FsWatchEventType.Modify;

						void fsEntryFromPath(changedPath).then((entry) => {
							const message: FsWatchMessageServer = {
								entry: entry ?? undefined,
								event: entry ? event : FsWatchEventType.Delete,
								path: changedPath,
								type: FsWatchMessageServerType.Change,
							};

							for (const cb of callbacks) {
								cb(message);
							}
						});
					},
				);

				state = {
					callbacks,
					dirPath,
					recursive,
					watcher,
				};

				this.watchers.set(key, state);
			} catch (err) {
				callback({
					message: (err as Error).message,
					path: dirPath,
					type: FsWatchMessageServerType.Error,
				});
				return () => {};
			}
		}

		try {
			const entries = await fsDirEntries(dirPath);
			callback({
				entries,
				path: dirPath,
				type: FsWatchMessageServerType.Initial,
			});
		} catch {
			callback({
				entries: [],
				path: dirPath,
				type: FsWatchMessageServerType.Initial,
			});
		}

		return () => {
			const currentState = this.watchers.get(key);
			if (!currentState) return;

			currentState.callbacks.delete(callback);

			if (currentState.callbacks.size === 0) {
				currentState.watcher.close();
				this.watchers.delete(key);
			}
		};
	}

	watchersCount(): number {
		return this.watchers.size;
	}
}

export const fsService = new FsService();
