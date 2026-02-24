import type { TerminalShortcutId } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.id";
import type { TerminalShortcut } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.types";
import { api } from "$lib/api/api.client";

let shortcuts = $state<TerminalShortcut[]>([]);
let loaded = $state(false);

export function terminalShortcutsGet(): TerminalShortcut[] {
	return shortcuts;
}

export function terminalShortcutsIsLoaded(): boolean {
	return loaded;
}

export async function terminalShortcutsLoad(): Promise<void> {
	const { data } = await api["terminal-shortcuts"].get();
	if (data) {
		shortcuts = data;
		loaded = true;
	}
}

export async function terminalShortcutCreate(
	label: string,
	command: string,
	color: string | null,
	sendCtrlC = false,
	sendEnter = false,
): Promise<void> {
	const sortOrder = shortcuts.length;
	const { data } = await api["terminal-shortcuts"].post({
		color,
		command,
		label,
		sendCtrlC,
		sendEnter,
		sortOrder,
	});
	if (data) {
		shortcuts = [
			...shortcuts,
			data as TerminalShortcut,
		];
	}
}

export async function terminalShortcutUpdate(
	id: TerminalShortcutId,
	patch: {
		label?: string;
		command?: string;
		color?: string | null;
		sendCtrlC?: boolean;
		sendEnter?: boolean;
	},
): Promise<void> {
	const { data } = await api["terminal-shortcuts"]({
		id,
	}).patch(patch);
	if (data && "id" in data) {
		shortcuts = shortcuts.map((s) => (s.id === id ? (data as TerminalShortcut) : s));
	}
}

export async function terminalShortcutDelete(id: TerminalShortcutId): Promise<void> {
	await api["terminal-shortcuts"]({
		id,
	}).delete();
	shortcuts = shortcuts.filter((s) => s.id !== id);
}

export async function terminalShortcutsReorder(ids: TerminalShortcutId[]): Promise<void> {
	const reorderPayload = ids.map((id, index) => ({
		id,
		sortOrder: index,
	}));
	const { data } = await api["terminal-shortcuts"].reorder.put(reorderPayload);
	if (data && Array.isArray(data)) {
		shortcuts = data as TerminalShortcut[];
	}
}
