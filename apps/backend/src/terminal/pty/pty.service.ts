import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { type IPty, spawn } from "bun-pty";

import { type TerminalPtyMessageServer, TerminalPtyMessageServerType } from "./pty.types";

type TerminalPtyInstance = {
	onData: (callback: (message: TerminalPtyMessageServer) => void) => void;
	process: IPty;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
};

const terminalPtyInstances = new Map<TerminalId, TerminalPtyInstance>();

export function terminalPtyInstanceGet(terminalId: TerminalId): TerminalPtyInstance | undefined {
	return terminalPtyInstances.get(terminalId);
}

export function terminalPtyInstanceSpawn(
	terminalId: TerminalId,
	cwd: string,
	cols = 80,
	rows = 24,
): TerminalPtyInstance {
	const existing = terminalPtyInstances.get(terminalId);
	if (existing) {
		return existing;
	}

	const envStrings: Record<string, string> = {};
	for (const [key, value] of Object.entries(Bun.env)) {
		if (typeof value === "string") {
			envStrings[key] = value;
		}
	}

	const ptyProcess = spawn("/bin/bash", [], {
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

	const dataCallbacks: ((message: TerminalPtyMessageServer) => void)[] = [];

	ptyProcess.onData((data) => {
		const message: TerminalPtyMessageServer = {
			data,
			type: TerminalPtyMessageServerType.Output,
		};
		for (const cb of dataCallbacks) {
			cb(message);
		}
	});

	ptyProcess.onExit(({ exitCode }) => {
		const message: TerminalPtyMessageServer = {
			code: exitCode,
			type: TerminalPtyMessageServerType.Exit,
		};
		for (const cb of dataCallbacks) {
			cb(message);
		}
		terminalPtyInstances.delete(terminalId);
	});

	const instance: TerminalPtyInstance = {
		onData: (callback) => {
			dataCallbacks.push(callback);
		},
		process: ptyProcess,
		resize: (newCols, newRows) => {
			ptyProcess.resize(newCols, newRows);
		},
		write: (data) => {
			ptyProcess.write(data);
		},
	};

	terminalPtyInstances.set(terminalId, instance);
	return instance;
}

export function terminalPtyInstanceKill(terminalId: TerminalId): boolean {
	const instance = terminalPtyInstances.get(terminalId);
	if (!instance) {
		return false;
	}

	instance.process.kill();
	terminalPtyInstances.delete(terminalId);
	return true;
}

export function terminalPtyInstancesGetAll(): Map<TerminalId, TerminalPtyInstance> {
	return terminalPtyInstances;
}

export type { TerminalPtyInstance };
