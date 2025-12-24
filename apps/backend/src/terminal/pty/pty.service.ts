import {
	type TerminalPtyMessageServer,
	TerminalPtyMessageServerType,
} from "@claude-manager/common/src/terminal/pty.types";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { type IPty, spawn } from "bun-pty";

type Unsubscribe = () => void;

type TerminalPtyInstance = {
	kill: () => void;
	onData: (callback: (message: TerminalPtyMessageServer) => void) => Unsubscribe;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
};

type InternalPtyState = {
	callbacks: Set<(message: TerminalPtyMessageServer) => void>;
	process: IPty;
	terminalId: TerminalId;
};

class PtyService {
	private instances = new Map<TerminalId, InternalPtyState>();

	private instanceWrap(state: InternalPtyState): TerminalPtyInstance {
		return {
			kill: () => this.instanceKill(state.terminalId),
			onData: (callback) => {
				state.callbacks.add(callback);
				return () => {
					state.callbacks.delete(callback);
				};
			},
			resize: (cols, rows) => {
				state.process.resize(cols, rows);
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

		const shell = Bun.env.SHELL ?? "/bin/bash";

		const envStrings: Record<string, string> = {};
		for (const [key, value] of Object.entries(Bun.env)) {
			if (typeof value === "string") {
				envStrings[key] = value;
			}
		}

		const process = spawn(shell, [], {
			cols,
			cwd,
			env: {
				...envStrings,
				COLORTERM: "truecolor",
				TERM: "xterm-256color",
			},
			name: "xterm-256color",
			rows,
		});

		const callbacks = new Set<(message: TerminalPtyMessageServer) => void>();

		const state: InternalPtyState = {
			callbacks,
			process,
			terminalId,
		};

		process.onData((data) => {
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
			this.instances.delete(terminalId);
		});

		this.instances.set(terminalId, state);
		return this.instanceWrap(state);
	}

	instanceKill(terminalId: TerminalId): boolean {
		const state = this.instances.get(terminalId);
		if (!state) {
			return false;
		}

		state.callbacks.clear();
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
}

export const terminalPtyService = new PtyService();
