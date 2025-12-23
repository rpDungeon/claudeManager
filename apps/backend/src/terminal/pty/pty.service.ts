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

const ptyInstances = new Map<TerminalId, InternalPtyState>();

export function terminalPtyInstanceGet(terminalId: TerminalId): TerminalPtyInstance | undefined {
	const state = ptyInstances.get(terminalId);
	if (!state) return undefined;
	return terminalPtyInstanceWrap(state);
}

export function terminalPtyInstanceSpawn(
	terminalId: TerminalId,
	cwd: string,
	cols = 80,
	rows = 24,
): TerminalPtyInstance {
	const existing = ptyInstances.get(terminalId);
	if (existing) {
		return terminalPtyInstanceWrap(existing);
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
		ptyInstances.delete(terminalId);
	});

	ptyInstances.set(terminalId, state);
	return terminalPtyInstanceWrap(state);
}

export function terminalPtyInstanceKill(terminalId: TerminalId): boolean {
	const state = ptyInstances.get(terminalId);
	if (!state) {
		return false;
	}

	state.callbacks.clear();
	state.process.kill();
	ptyInstances.delete(terminalId);
	return true;
}

export function terminalPtyInstancesCount(): number {
	return ptyInstances.size;
}

export function terminalPtyInstanceIds(): TerminalId[] {
	return [
		...ptyInstances.keys(),
	];
}

function terminalPtyInstanceWrap(state: InternalPtyState): TerminalPtyInstance {
	return {
		kill: () => terminalPtyInstanceKill(state.terminalId),
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

export type { TerminalPtyInstance };
