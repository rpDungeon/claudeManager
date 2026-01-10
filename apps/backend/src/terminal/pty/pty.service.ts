import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
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

function foregroundProcessGetBySocket(socketPath: string): string | null {
	try {
		if (!existsSync(socketPath)) return null;

		const fuserOutput = execSync(`fuser "${socketPath}" 2>/dev/null`, {
			encoding: "utf-8",
		}).trim();
		if (!fuserOutput) return null;

		const dtachPid = Number.parseInt(fuserOutput.split(WHITESPACE_REGEX).pop() || "", 10);
		if (Number.isNaN(dtachPid)) return null;

		const childPidStr = execSync(`pgrep -P ${dtachPid}`, {
			encoding: "utf-8",
		}).trim();
		if (!childPidStr) return null;

		const shellPid = Number.parseInt(childPidStr.split("\n")[0], 10);
		if (Number.isNaN(shellPid)) return null;

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

type TerminalPtyInstance = {
	foregroundProcessGet: () => string | null;
	getScrollback: () => string;
	isInShellContext: () => boolean;
	kill: () => void;
	onData: (callback: (message: TerminalPtyMessageServer) => void) => Unsubscribe;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
};

type InternalPtyState = {
	callbacks: Set<(message: TerminalPtyMessageServer) => void>;
	cols: number;
	createdAt: Date;
	headlessTerminal: Terminal;
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

		console.log(`[PTY] Spawning terminal ${terminalId} with cwd: ${cwd}, isReattach: ${isReattach}`);

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

		const state: InternalPtyState = {
			callbacks,
			cols,
			createdAt: new Date(),
			headlessTerminal,
			process,
			rows,
			serializeAddon,
			socketPath,
			terminalId,
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
			headlessTerminal.dispose();
			this.instances.delete(terminalId);

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

		scrollbackDelete(terminalId);

		const interval = this.saveIntervals.get(terminalId);
		if (interval) {
			clearInterval(interval);
			this.saveIntervals.delete(terminalId);
		}

		if (!state) {
			return false;
		}

		state.callbacks.clear();
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
