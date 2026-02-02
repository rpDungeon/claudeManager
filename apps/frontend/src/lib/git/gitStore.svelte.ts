import {
	type GitFileEntry,
	GitFileStatusCode,
	type GitStatus,
	GitWatchMessageClientType,
	GitWatchMessageServerType,
} from "@claude-manager/common/src/git/git.types";
import { SvelteMap } from "svelte/reactivity";
import { api, authTokenQueryGet } from "$lib/api/api.client";
import { FileStatus } from "$lib/fileTree/fileTree.lib";

type WsConnection = ReturnType<typeof api.ws.git.watch.subscribe>;

function gitStatusCodeToFileStatus(entry: GitFileEntry): FileStatus {
	const indexStatus = entry.statusIndex;
	const workingStatus = entry.statusWorking;

	if (indexStatus === GitFileStatusCode.Added || indexStatus === GitFileStatusCode.Modified) {
		return FileStatus.Staged;
	}
	if (workingStatus === GitFileStatusCode.Modified) {
		return FileStatus.Modified;
	}
	if (workingStatus === GitFileStatusCode.Untracked || indexStatus === GitFileStatusCode.Untracked) {
		return FileStatus.Untracked;
	}
	if (workingStatus === GitFileStatusCode.Deleted || indexStatus === GitFileStatusCode.Deleted) {
		return FileStatus.Modified;
	}
	if (indexStatus === GitFileStatusCode.UpdatedButUnmerged || workingStatus === GitFileStatusCode.UpdatedButUnmerged) {
		return FileStatus.Conflicted;
	}
	if (indexStatus === GitFileStatusCode.Ignored || workingStatus === GitFileStatusCode.Ignored) {
		return FileStatus.Ignored;
	}

	return FileStatus.Clean;
}

class GitStore {
	repoPath = $state<string | null>(null);
	statusMap = $state(new SvelteMap<string, FileStatus>());
	rawStatus = $state<GitStatus | null>(null);
	branch = $state<string | null>(null);
	ahead = $state(0);
	behind = $state(0);
	isLoading = $state(false);
	isConnected = $state(false);
	error = $state<string | null>(null);

	private wsConnection = $state<WsConnection | null>(null);

	connect(repoPath: string) {
		if (this.wsConnection && this.repoPath === repoPath) {
			return;
		}

		this.disconnect();

		this.repoPath = repoPath;
		this.isLoading = true;
		this.error = null;

		const ws = api.ws.git.watch.subscribe({
			query: authTokenQueryGet(),
		});
		this.wsConnection = ws;

		ws.on("open", () => {
			this.isConnected = true;
			ws.send({
				path: repoPath,
				type: GitWatchMessageClientType.Watch,
			});
		});

		ws.subscribe((message) => {
			const msg = message.data;

			if (msg.type === GitWatchMessageServerType.Status) {
				this.updateStatus(msg.status);
				this.isLoading = false;
			} else if (msg.type === GitWatchMessageServerType.Error) {
				this.error = msg.message;
				this.isLoading = false;
			}
		});

		ws.on("error", (err) => {
			console.error("[GitStore] WebSocket error:", err);
			this.error = "Connection error";
			this.isConnected = false;
		});

		ws.on("close", () => {
			this.isConnected = false;
		});
	}

	private updateStatus(status: GitStatus) {
		this.rawStatus = status;
		this.branch = status.branch;
		this.ahead = status.ahead;
		this.behind = status.behind;

		this.statusMap.clear();

		for (const file of status.files) {
			const absolutePath = this.repoPath ? `${this.repoPath}/${file.path}` : file.path;
			const normalizedPath = absolutePath.replace(/\/+/g, "/");
			const fileStatus = gitStatusCodeToFileStatus(file);
			this.statusMap.set(normalizedPath, fileStatus);
		}
	}

	getFileStatus(absolutePath: string): FileStatus | undefined {
		return this.statusMap.get(absolutePath);
	}

	disconnect() {
		if (this.wsConnection) {
			if (this.repoPath) {
				this.wsConnection.send({
					path: this.repoPath,
					type: GitWatchMessageClientType.Unwatch,
				});
			}
			this.wsConnection.close();
			this.wsConnection = null;
		}
		this.repoPath = null;
		this.statusMap.clear();
		this.rawStatus = null;
		this.branch = null;
		this.ahead = 0;
		this.behind = 0;
		this.isLoading = false;
		this.isConnected = false;
		this.error = null;
	}
}

export const gitStore = new GitStore();
