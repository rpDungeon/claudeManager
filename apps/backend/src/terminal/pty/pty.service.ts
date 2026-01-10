import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import {
	type TerminalPtyMessageServer,
	TerminalPtyMessageServerType,
} from "@claude-manager/common/src/terminal/pty.types";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { SerializeAddon } from "@xterm/addon-serialize";
import type { ITerminalAddon } from "@xterm/headless";
import { Terminal } from "@xterm/headless";
import { type IPty, spawn } from "bun-pty";

type Unsubscribe = () => void;

const SHELL_PROCESSES = new Set([
	"bash",
	"zsh",
	"fish",
	"sh",
	"dash",
	"ksh",
	"tcsh",
	"csh",
]);

// Cache dtach PIDs - they don't change for a given socket
const dtachPidCache = new Map<string, number>();

// Debounce delay for foreground process checks (ms)
const FOREGROUND_PROCESS_DEBOUNCE_MS = 300;

const PID_REGEX = /^\d+$/;
const WHITESPACE_REGEX = /\s+/;

function foregroundProcessGetFromShellPid(shellPid: number): string | null {
	try {
		const statPath = `/proc/${shellPid}/stat`;
		if (!existsSync(statPath)) return null;

		const stat = readFileSync(statPath, "utf-8");
		const parts = stat.split(" ");
		const tpgid = Number.parseInt(parts[7], 10);

		if (Number.isNaN(tpgid)) return null;

		const fgCommPath = `/proc/${tpgid}/comm`;
		if (existsSync(fgCommPath)) {
			return readFileSync(fgCommPath, "utf-8").trim();
		}

		return null;
	} catch {
		return null;
	}
}

// Find which PID has a socket open by scanning /proc - replaces `fuser`
function findSocketOwnerPid(socketPath: string): number | null {
	try {
		const socketStat = statSync(socketPath);
		const socketInode = socketStat.ino;

		const procDirs = readdirSync("/proc").filter((name) => PID_REGEX.test(name));

		for (const pid of procDirs) {
			const fdDir = `/proc/${pid}/fd`;
			try {
				const fds = readdirSync(fdDir);
				for (const fd of fds) {
					try {
						const link = readlinkSync(`${fdDir}/${fd}`);
						// Socket links look like "socket:[12345]" where 12345 is the inode
						if (link.includes(`socket:[${socketInode}]`)) {
							return Number.parseInt(pid, 10);
						}
					} catch {
						// Can't read this fd, skip
					}
				}
			} catch {
				// Can't read this process's fds, skip
			}
		}

		return null;
	} catch {
		return null;
	}
}

// Find child PIDs of a process by reading /proc - replaces `pgrep -P`
function findChildPids(parentPid: number): number[] {
	try {
		const childrenPath = `/proc/${parentPid}/task/${parentPid}/children`;
		if (existsSync(childrenPath)) {
			const children = readFileSync(childrenPath, "utf-8").trim();
			if (children) {
				return children
					.split(WHITESPACE_REGEX)
					.map((pid) => Number.parseInt(pid, 10))
					.filter((pid) => !Number.isNaN(pid));
			}
		}
		return [];
	} catch {
		return [];
	}
}

function foregroundProcessGetBySocket(socketPath: string): string | null {
	try {
		if (!existsSync(socketPath)) return null;

		// Check cache for dtach PID
		let dtachPid = dtachPidCache.get(socketPath);

		if (dtachPid === undefined) {
			// Find dtach PID via /proc (no process spawn!)
			dtachPid = findSocketOwnerPid(socketPath) ?? undefined;
			if (dtachPid !== undefined) {
				dtachPidCache.set(socketPath, dtachPid);
			}
		}

		if (dtachPid === undefined) return null;

		// Verify dtach is still running
		if (!existsSync(`/proc/${dtachPid}`)) {
			dtachPidCache.delete(socketPath);
			return null;
		}

		// Find shell child of dtach via /proc (no process spawn!)
		const children = findChildPids(dtachPid);
		if (children.length === 0) return null;

		const shellPid = children[0];
		return foregroundProcessGetFromShellPid(shellPid);
	} catch {
		return null;
	}
}

function isInShellContext(socketPath: string): boolean {
	const fg = foregroundProcessGetBySocket(socketPath);
	if (!fg) return true;
	return SHELL_PROCESSES.has(fg);
}

// Clear cached dtach PID when socket is removed
function clearDtachPidCache(socketPath: string): void {
	dtachPidCache.delete(socketPath);
}

type ForegroundProcessCallback = (process: string | null) => void;

type TerminalPtyInstance = {
	foregroundProcessGet: () => string | null;
	getScrollback: () => string;
	isInShellContext: () => boolean;
	kill: () => void;
	onData: (callback: (message: TerminalPtyMessageServer) => void) => Unsubscribe;
	onForegroundProcessChange: (callback: ForegroundProcessCallback) => Unsubscribe;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
};

type InternalPtyState = {
	callbacks: Set<(message: TerminalPtyMessageServer) => void>;
	cols: number;
	createdAt: Date;
	debounceTimer: ReturnType<typeof setTimeout> | null;
	foregroundProcessCallbacks: Set<ForegroundProcessCallback>;
	headlessTerminal: Terminal;
	lastForegroundProcess: string | null;
	process: IPty;
	rows: number;
	serializeAddon: SerializeAddon;
	socketPath: string;
	terminalId: TerminalId;
};

const TERMINAL_DATA_DIR = resolve(Bun.env.TERMINAL_DATA_DIR);
const SOCKET_DIR = `${TERMINAL_DATA_DIR}/sockets`;
const SCROLLBACK_DIR = `${TERMINAL_DATA_DIR}/scrollback`;
const SCROLLBACK_LINES = 10_000;
const SCROLLBACK_SAVE_INTERVAL = 5000;

function terminalIdToSocketPath(terminalId: TerminalId): string {
	const sanitized = terminalId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return `${SOCKET_DIR}/${sanitized}.sock`;
}

function terminalIdToScrollbackPath(terminalId: TerminalId): string {
	const sanitized = terminalId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return `${SCROLLBACK_DIR}/${sanitized}.scrollback`;
}

function socketDirEnsure(): void {
	if (!existsSync(SOCKET_DIR)) {
		mkdirSync(SOCKET_DIR, {
			recursive: true,
		});
	}
	if (!existsSync(SCROLLBACK_DIR)) {
		mkdirSync(SCROLLBACK_DIR, {
			recursive: true,
		});
	}
}

function scrollbackLoad(terminalId: TerminalId): string | null {
	const path = terminalIdToScrollbackPath(terminalId);
	if (existsSync(path)) {
		try {
			return readFileSync(path, "utf-8");
		} catch (error) {
			console.error(`[Terminal] Failed to load scrollback for ${terminalId}:`, error);
			return null;
		}
	}
	return null;
}

function scrollbackSave(terminalId: TerminalId, data: string): void {
	const path = terminalIdToScrollbackPath(terminalId);
	try {
		writeFileSync(path, data);
	} catch (error) {
		console.error(`[Terminal] Failed to save scrollback for ${terminalId}:`, error);
	}
}

function scrollbackDelete(terminalId: TerminalId): void {
	const path = terminalIdToScrollbackPath(terminalId);
	try {
		if (existsSync(path)) {
			unlinkSync(path);
		}
	} catch (error) {
		console.error(`[Terminal] Failed to delete scrollback for ${terminalId}:`, error);
	}
}

class PtyService {
	private instances = new Map<TerminalId, InternalPtyState>();
	private saveIntervals = new Map<TerminalId, ReturnType<typeof setInterval>>();

	private instanceWrap(state: InternalPtyState): TerminalPtyInstance {
		return {
			foregroundProcessGet: () => foregroundProcessGetBySocket(state.socketPath),
			getScrollback: () => state.serializeAddon.serialize(),
			isInShellContext: () => isInShellContext(state.socketPath),
			kill: () => this.instanceKill(state.terminalId),
			onData: (callback) => {
				state.callbacks.add(callback);
				return () => {
					state.callbacks.delete(callback);
				};
			},
			onForegroundProcessChange: (callback) => {
				state.foregroundProcessCallbacks.add(callback);
				// Immediately call with current value
				callback(state.lastForegroundProcess);
				return () => {
					state.foregroundProcessCallbacks.delete(callback);
				};
			},
			resize: (cols, rows) => {
				state.cols = cols;
				state.rows = rows;
				state.process.resize(cols, rows);
				state.headlessTerminal.resize(cols, rows);
			},
			write: (data) => {
				state.process.write(data);
			},
		};
	}

	instanceGet(terminalId: TerminalId): TerminalPtyInstance | undefined {
		const state = this.instances.get(terminalId);
		if (!state) return undefined;
		return this.instanceWrap(state);
	}

	instanceSpawn(terminalId: TerminalId, cwd: string, cols = 80, rows = 24): TerminalPtyInstance {
		const existing = this.instances.get(terminalId);
		if (existing) {
			return this.instanceWrap(existing);
		}

		socketDirEnsure();
		const socketPath = terminalIdToSocketPath(terminalId);
		const isReattach = existsSync(socketPath);

		const headlessTerminal = new Terminal({
			allowProposedApi: true,
			cols,
			rows,
			scrollback: SCROLLBACK_LINES,
		});

		const serializeAddon = new SerializeAddon();
		headlessTerminal.loadAddon(serializeAddon as unknown as ITerminalAddon);

		if (isReattach) {
			const savedScrollback = scrollbackLoad(terminalId);
			if (savedScrollback) {
				headlessTerminal.write(savedScrollback);
			}
		}

		const envStrings: Record<string, string> = {};
		for (const [key, value] of Object.entries(Bun.env)) {
			if (typeof value === "string") {
				envStrings[key] = value;
			}
		}

		const process = spawn(
			"dtach",
			[
				"-A",
				socketPath,
				"-r",
				"winch",
				"/bin/bash",
				"-c",
				`cd ${JSON.stringify(cwd)} && exec /bin/bash`,
			],
			{
				cols,
				cwd,
				env: {
					...envStrings,
					COLORTERM: "truecolor",
					TERM: "xterm-256color",
				},
				name: "xterm-256color",
				rows,
			},
		);

		const callbacks = new Set<(message: TerminalPtyMessageServer) => void>();
		const foregroundProcessCallbacks = new Set<ForegroundProcessCallback>();

		const state: InternalPtyState = {
			callbacks,
			cols,
			createdAt: new Date(),
			debounceTimer: null,
			foregroundProcessCallbacks,
			headlessTerminal,
			lastForegroundProcess: null,
			process,
			rows,
			serializeAddon,
			socketPath,
			terminalId,
		};

		// Helper to check and notify foreground process changes
		const checkForegroundProcess = () => {
			const newProcess = foregroundProcessGetBySocket(socketPath);
			if (newProcess !== state.lastForegroundProcess) {
				state.lastForegroundProcess = newProcess;
				for (const cb of foregroundProcessCallbacks) {
					cb(newProcess);
				}
			}
		};

		process.onData((data) => {
			headlessTerminal.write(data);

			const message: TerminalPtyMessageServer = {
				data,
				type: TerminalPtyMessageServerType.Output,
			};
			for (const cb of callbacks) {
				cb(message);
			}

			// Debounced foreground process check - only when there's activity
			if (state.debounceTimer) {
				clearTimeout(state.debounceTimer);
			}
			state.debounceTimer = setTimeout(checkForegroundProcess, FOREGROUND_PROCESS_DEBOUNCE_MS);
		});

		process.onExit(({ exitCode }) => {
			const message: TerminalPtyMessageServer = {
				code: exitCode,
				type: TerminalPtyMessageServerType.Exit,
			};
			for (const cb of callbacks) {
				cb(message);
			}
			callbacks.clear();
			foregroundProcessCallbacks.clear();
			headlessTerminal.dispose();
			this.instances.delete(terminalId);

			// Clean up debounce timer
			if (state.debounceTimer) {
				clearTimeout(state.debounceTimer);
				state.debounceTimer = null;
			}

			// Clear dtach PID cache
			clearDtachPidCache(socketPath);

			const interval = this.saveIntervals.get(terminalId);
			if (interval) {
				clearInterval(interval);
				this.saveIntervals.delete(terminalId);
			}
		});

		const saveInterval = setInterval(() => {
			const serialized = serializeAddon.serialize();
			scrollbackSave(terminalId, serialized);
		}, SCROLLBACK_SAVE_INTERVAL);
		this.saveIntervals.set(terminalId, saveInterval);

		this.instances.set(terminalId, state);
		return this.instanceWrap(state);
	}

	instanceKill(terminalId: TerminalId): boolean {
		const state = this.instances.get(terminalId);
		const socketPath = terminalIdToSocketPath(terminalId);

		try {
			if (existsSync(socketPath)) {
				unlinkSync(socketPath);
			}
		} catch (error) {
			console.error(`[Terminal] Failed to delete socket for ${terminalId}:`, error);
		}

		// Clear dtach PID cache
		clearDtachPidCache(socketPath);

		scrollbackDelete(terminalId);

		const interval = this.saveIntervals.get(terminalId);
		if (interval) {
			clearInterval(interval);
			this.saveIntervals.delete(terminalId);
		}

		if (!state) {
			return false;
		}

		// Clean up debounce timer
		if (state.debounceTimer) {
			clearTimeout(state.debounceTimer);
		}

		state.callbacks.clear();
		state.foregroundProcessCallbacks.clear();
		state.headlessTerminal.dispose();
		state.process.kill();
		this.instances.delete(terminalId);
		return true;
	}

	instancesCount(): number {
		return this.instances.size;
	}

	instanceIds(): TerminalId[] {
		return [
			...this.instances.keys(),
		];
	}

	instanceIsRunning(terminalId: TerminalId): boolean {
		return this.instances.has(terminalId);
	}

	instanceInfo(terminalId: TerminalId):
		| {
				cols: number;
				createdAt: Date;
				rows: number;
		  }
		| undefined {
		const state = this.instances.get(terminalId);
		if (!state) return undefined;
		return {
			cols: state.cols,
			createdAt: state.createdAt,
			rows: state.rows,
		};
	}

	instancesInfo(): Array<{
		cols: number;
		createdAt: Date;
		rows: number;
		terminalId: TerminalId;
	}> {
		return Array.from(this.instances.entries()).map(([terminalId, state]) => ({
			cols: state.cols,
			createdAt: state.createdAt,
			rows: state.rows,
			terminalId,
		}));
	}
}

export const terminalPtyService = new PtyService();
