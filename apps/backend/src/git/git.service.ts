import * as path from "node:path";
import process from "node:process";
import {
	type GitDiffResponse,
	type GitFileEntry,
	GitFileStatusCode,
	type GitStatus,
	type GitWatchMessageServer,
	GitWatchMessageServerType,
} from "@claude-manager/common/src/git/git.types";
import { watch } from "chokidar";
import simpleGit, { type SimpleGit, type StatusResult } from "simple-git";

type GitWatchCallback = (message: GitWatchMessageServer) => void;
type Unsubscribe = () => void;

type WatcherState = {
	callbacks: Set<GitWatchCallback>;
	debounceTimer: ReturnType<typeof setTimeout> | null;
	repoPath: string;
	watcher: ReturnType<typeof watch>;
};

const GIT_STATUS_CODE_MAP: Record<string, GitFileStatusCode> = {
	" ": GitFileStatusCode.Unmodified,
	"!": GitFileStatusCode.Ignored,
	"?": GitFileStatusCode.Untracked,
	A: GitFileStatusCode.Added,
	C: GitFileStatusCode.Copied,
	D: GitFileStatusCode.Deleted,
	M: GitFileStatusCode.Modified,
	R: GitFileStatusCode.Renamed,
	U: GitFileStatusCode.UpdatedButUnmerged,
};

function gitStatusCodeParse(code: string): GitFileStatusCode {
	return GIT_STATUS_CODE_MAP[code] ?? GitFileStatusCode.Unmodified;
}

function gitStatusTransform(result: StatusResult): GitStatus {
	const files: GitFileEntry[] = result.files.map((file) => ({
		path: file.path,
		statusIndex: gitStatusCodeParse(file.index),
		statusWorking: gitStatusCodeParse(file.working_dir),
	}));

	return {
		ahead: result.ahead,
		behind: result.behind,
		branch: result.current ?? null,
		files,
	};
}

class GitService {
	private watchers = new Map<string, WatcherState>();

	private gitInstance(repoPath: string): SimpleGit {
		return simpleGit(repoPath);
	}

	async statusGet(repoPath: string): Promise<GitStatus> {
		const git = this.gitInstance(repoPath);
		const result = await git.status();
		return gitStatusTransform(result);
	}

	async filesStage(repoPath: string, filePaths: string[]): Promise<void> {
		const git = this.gitInstance(repoPath);
		await git.add(filePaths);
	}

	async filesUnstage(repoPath: string, filePaths: string[]): Promise<void> {
		const git = this.gitInstance(repoPath);
		await git.reset([
			"HEAD",
			"--",
			...filePaths,
		]);
	}

	async filesStageAll(repoPath: string): Promise<void> {
		const git = this.gitInstance(repoPath);
		await git.add("-A");
	}

	async filesUnstageAll(repoPath: string): Promise<void> {
		const git = this.gitInstance(repoPath);
		await git.reset([
			"HEAD",
		]);
	}

	async commit(repoPath: string, message: string): Promise<void> {
		const git = this.gitInstance(repoPath);
		await git.commit(message);
	}

	async diffGet(repoPath: string, filePath: string, staged: boolean): Promise<GitDiffResponse> {
		const git = this.gitInstance(repoPath);
		const args = staged
			? [
					"--cached",
					"--",
					filePath,
				]
			: [
					"--",
					filePath,
				];
		const diff = await git.diff(args);
		return {
			diff,
			filePath,
			staged,
		};
	}

	async watchStart(repoPath: string, callback: GitWatchCallback): Promise<Unsubscribe> {
		let state = this.watchers.get(repoPath);

		if (state) {
			state.callbacks.add(callback);
		} else {
			const callbacks = new Set<GitWatchCallback>();
			callbacks.add(callback);

			const gitDir = path.join(repoPath, ".git");
			const watchPaths = [
				path.join(gitDir, "index"),
				path.join(gitDir, "HEAD"),
				path.join(gitDir, "refs"),
			];

			try {
				process.stderr.write(`[Git Watch] Creating watcher for: ${repoPath}\n`);
				const watcher = watch(watchPaths, {
					atomic: true,
					ignoreInitial: true,
					persistent: true,
					usePolling: true,
				});

				const sendStatus = async () => {
					try {
						const status = await this.statusGet(repoPath);
						const message: GitWatchMessageServer = {
							path: repoPath,
							status,
							type: GitWatchMessageServerType.Status,
						};
						for (const cb of callbacks) {
							cb(message);
						}
					} catch (err) {
						for (const cb of callbacks) {
							cb({
								message: err instanceof Error ? err.message : String(err),
								path: repoPath,
								type: GitWatchMessageServerType.Error,
							});
						}
					}
				};

				const debouncedSendStatus = () => {
					const currentState = this.watchers.get(repoPath);
					if (currentState?.debounceTimer) {
						clearTimeout(currentState.debounceTimer);
					}
					if (currentState) {
						currentState.debounceTimer = setTimeout(() => {
							void sendStatus();
						}, 300);
					}
				};

				watcher.on("all", () => {
					debouncedSendStatus();
				});

				watcher.on("error", (err: unknown) => {
					for (const cb of callbacks) {
						cb({
							message: err instanceof Error ? err.message : String(err),
							path: repoPath,
							type: GitWatchMessageServerType.Error,
						});
					}
				});

				state = {
					callbacks,
					debounceTimer: null,
					repoPath,
					watcher,
				};

				this.watchers.set(repoPath, state);
			} catch (err) {
				callback({
					message: (err as Error).message,
					path: repoPath,
					type: GitWatchMessageServerType.Error,
				});
				return () => {};
			}
		}

		try {
			const status = await this.statusGet(repoPath);
			callback({
				path: repoPath,
				status,
				type: GitWatchMessageServerType.Status,
			});
		} catch (err) {
			callback({
				message: err instanceof Error ? err.message : String(err),
				path: repoPath,
				type: GitWatchMessageServerType.Error,
			});
		}

		return () => {
			const currentState = this.watchers.get(repoPath);
			if (!currentState) {
				return;
			}

			currentState.callbacks.delete(callback);

			if (currentState.callbacks.size === 0) {
				if (currentState.debounceTimer) {
					clearTimeout(currentState.debounceTimer);
				}
				void currentState.watcher.close();
				this.watchers.delete(repoPath);
				process.stderr.write(`[Git Watch] Closed watcher for: ${repoPath}\n`);
			}
		};
	}

	watchersCount(): number {
		return this.watchers.size;
	}
}

export const gitService = new GitService();
