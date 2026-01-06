import type * as nodefs from "node:fs";
import * as nodefsPromises from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import { fsMaxFileSize } from "@claude-manager/common/src/fs/fs.config";
import {
	type FsEntry,
	FsEntryErrorCode,
	FsEntryType,
	type FsFileListItem,
	type FsReadResponse,
	FsWatchEventType,
	type FsWatchMessageServer,
	FsWatchMessageServerType,
} from "@claude-manager/common/src/fs/fs.types";
import { fsPathNormalize } from "@claude-manager/common/src/fs/fs.utils";
import { type FSWatcher, watch } from "chokidar";

type Unsubscribe = () => void;
type FsWatchCallback = (message: FsWatchMessageServer) => void;

type FsWatcherState = {
	callbacks: Set<FsWatchCallback>;
	dirPath: string;
	recursive: boolean;
	watcher: FSWatcher;
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

type FsWriteResult =
	| {
			ok: true;
			data: FsEntry;
	  }
	| {
			ok: false;
			error: string;
			status: 400 | 403 | 404 | 409;
	  };

type FsDeleteResult =
	| {
			ok: true;
	  }
	| {
			ok: false;
			error: string;
			status: 403 | 404;
	  };

type FsRenameResult =
	| {
			ok: true;
			data: FsEntry;
	  }
	| {
			ok: false;
			error: string;
			status: 400 | 403 | 404 | 409;
	  };

function fsEntryFromStats(filePath: string, stats: nodefs.Stats): FsEntry {
	const isDirectory = stats.isDirectory();
	const normalizedPath = fsPathNormalize(filePath, isDirectory);
	return {
		modifiedAt: stats.mtime.getTime(),
		name: path.basename(filePath),
		path: normalizedPath,
		size: stats.size,
		type: isDirectory ? FsEntryType.Directory : FsEntryType.File,
	};
}

function fsEntryErrorCreate(filePath: string, errnoCode?: string): FsEntry {
	let errorCode: FsEntryErrorCode;
	let message: string;

	switch (errnoCode) {
		case "EACCES":
			errorCode = FsEntryErrorCode.PermissionDenied;
			message = "Permission denied";
			break;
		case "ENOENT":
			errorCode = FsEntryErrorCode.NotFound;
			message = "File not found";
			break;
		default:
			errorCode = FsEntryErrorCode.Unknown;
			message = errnoCode ? `Cannot access: ${errnoCode}` : "Unknown error";
	}

	return {
		error: {
			code: errorCode,
			message,
		},
		modifiedAt: 0,
		name: path.basename(filePath),
		path: filePath,
		size: 0,
		type: FsEntryType.File,
	};
}

async function fsEntryFromPath(filePath: string): Promise<FsEntry> {
	try {
		const stats = await nodefsPromises.stat(filePath);
		return fsEntryFromStats(filePath, stats);
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		return fsEntryErrorCreate(filePath, code);
	}
}

async function fsDirEntries(dirPath: string): Promise<FsEntry[]> {
	const names = await nodefsPromises.readdir(dirPath);
	const entries: FsEntry[] = [];

	for (const name of names) {
		const entryPath = path.join(dirPath, name);
		const entry = await fsEntryFromPath(entryPath);
		entries.push(entry);
	}

	entries.sort((a, b) => {
		const aIsFolder = a.type === FsEntryType.Directory && !a.error;
		const bIsFolder = b.type === FsEntryType.Directory && !b.error;
		if (aIsFolder !== bIsFolder) {
			return aIsFolder ? -1 : 1;
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
				process.stderr.write(`[FS Watch] Creating watcher for: ${dirPath}\n`);
				const watcher = watch(dirPath, {
					atomic: true,
					depth: recursive ? undefined : 0,
					ignoreInitial: true,
					interval: 100,
					persistent: true,
					usePolling: true,
				});

				const sendChange = (changedPath: string, event: FsWatchEventType, entry?: FsEntry) => {
					const message: FsWatchMessageServer = {
						entry,
						event,
						path: changedPath,
						type: FsWatchMessageServerType.Change,
					};
					for (const cb of callbacks) {
						cb(message);
					}
				};

				watcher.on("ready", () => {});

				watcher.on("add", (filePath) => {
					void fsEntryFromPath(filePath).then((entry) => {
						if (entry) sendChange(filePath, FsWatchEventType.Rename, entry);
					});
				});

				watcher.on("addDir", (filePath) => {
					if (filePath === dirPath) return;
					void fsEntryFromPath(filePath).then((entry) => {
						if (entry) sendChange(filePath, FsWatchEventType.Rename, entry);
					});
				});

				watcher.on("change", (filePath) => {
					void fsEntryFromPath(filePath).then((entry) => {
						if (entry) sendChange(filePath, FsWatchEventType.Modify, entry);
					});
				});

				watcher.on("unlink", (filePath) => {
					sendChange(filePath, FsWatchEventType.Delete);
				});

				watcher.on("unlinkDir", (filePath) => {
					sendChange(filePath, FsWatchEventType.Delete);
				});

				watcher.on("error", (err: unknown) => {
					for (const cb of callbacks) {
						cb({
							message: err instanceof Error ? err.message : String(err),
							path: dirPath,
							type: FsWatchMessageServerType.Error,
						});
					}
				});

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
			if (!currentState) {
				return;
			}

			currentState.callbacks.delete(callback);

			if (currentState.callbacks.size === 0) {
				void currentState.watcher.close();
				this.watchers.delete(key);
			}
		};
	}

	watchersCount(): number {
		return this.watchers.size;
	}

	async rename(oldPath: string, newPath: string): Promise<FsRenameResult> {
		try {
			await nodefsPromises.stat(oldPath);
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return {
					error: "Source path not found",
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

		try {
			await nodefsPromises.stat(newPath);
			return {
				error: "Destination already exists",
				ok: false,
				status: 409,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code !== "ENOENT") {
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

		try {
			await nodefsPromises.rename(oldPath, newPath);
			const entry = await fsEntryFromPath(newPath);
			if (!entry) {
				return {
					error: "Failed to read renamed entry",
					ok: false,
					status: 400,
				};
			}
			return {
				data: entry,
				ok: true,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
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

	async delete(targetPath: string): Promise<FsDeleteResult> {
		try {
			const stats = await nodefsPromises.stat(targetPath);
			if (stats.isDirectory()) {
				await nodefsPromises.rm(targetPath, {
					recursive: true,
				});
			} else {
				await nodefsPromises.unlink(targetPath);
			}
			return {
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

	async fileCreate(filePath: string, content?: string): Promise<FsWriteResult> {
		try {
			await nodefsPromises.stat(filePath);
			return {
				error: "File already exists",
				ok: false,
				status: 409,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code !== "ENOENT") {
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

		const parentDir = path.dirname(filePath);
		try {
			await nodefsPromises.stat(parentDir);
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return {
					error: "Parent directory does not exist",
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

		try {
			const data = content ? Buffer.from(content, "base64") : Buffer.alloc(0);
			await nodefsPromises.writeFile(filePath, data);
			const entry = await fsEntryFromPath(filePath);
			if (!entry) {
				return {
					error: "Failed to read created file",
					ok: false,
					status: 400,
				};
			}
			return {
				data: entry,
				ok: true,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
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

	async folderCreate(folderPath: string): Promise<FsWriteResult> {
		try {
			await nodefsPromises.stat(folderPath);
			return {
				error: "Folder already exists",
				ok: false,
				status: 409,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code !== "ENOENT") {
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

		const parentDir = path.dirname(folderPath);
		try {
			await nodefsPromises.stat(parentDir);
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return {
					error: "Parent directory does not exist",
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

		try {
			await nodefsPromises.mkdir(folderPath);
			const entry = await fsEntryFromPath(folderPath);
			if (!entry) {
				return {
					error: "Failed to read created folder",
					ok: false,
					status: 400,
				};
			}
			return {
				data: entry,
				ok: true,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
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

	async fileUpdate(filePath: string, content: string): Promise<FsWriteResult> {
		try {
			const stats = await nodefsPromises.stat(filePath);
			if (stats.isDirectory()) {
				return {
					error: "Path is a directory",
					ok: false,
					status: 400,
				};
			}
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return {
					error: "File not found",
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

		try {
			const data = Buffer.from(content, "base64");
			await nodefsPromises.writeFile(filePath, data);
			const entry = await fsEntryFromPath(filePath);
			if (!entry) {
				return {
					error: "Failed to read updated file",
					ok: false,
					status: 400,
				};
			}
			return {
				data: entry,
				ok: true,
			};
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
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

	async listRecursive(
		rootPath: string,
		options: {
			excludePatterns?: string[];
			maxDepth?: number;
		} = {},
	): Promise<FsFileListItem[]> {
		const {
			excludePatterns = [
				"node_modules",
				".git",
				"dist",
				".svelte-kit",
				"__pycache__",
				".next",
				".cache",
				"coverage",
				".turbo",
			],
			maxDepth = 10,
		} = options;
		const files: FsFileListItem[] = [];

		const walk = async (dirPath: string, depth: number): Promise<void> => {
			if (depth > maxDepth) return;

			let entries: nodefs.Dirent[];
			try {
				entries = await nodefsPromises.readdir(dirPath, {
					withFileTypes: true,
				});
			} catch {
				return;
			}

			const subDirPromises: Promise<void>[] = [];

			for (const entry of entries) {
				if (excludePatterns.includes(entry.name)) {
					continue;
				}

				const fullPath = path.join(dirPath, entry.name);
				const relativePath = path.relative(rootPath, fullPath);

				if (entry.isDirectory()) {
					subDirPromises.push(walk(fullPath, depth + 1));
				} else if (entry.isFile()) {
					files.push({
						modifiedAt: 0,
						name: entry.name,
						path: fullPath,
						relativePath,
					});
				}
			}

			await Promise.all(subDirPromises);
		};

		await walk(rootPath, 0);
		return files;
	}
}

export const fsService = new FsService();
