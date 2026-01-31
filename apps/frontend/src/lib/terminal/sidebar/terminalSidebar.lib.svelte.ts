export enum TerminalSidebarTab {
	Activity = "activity",
	Transcriptions = "transcriptions",
	Settings = "settings",
}

export interface TranscriptionEntry {
	id: string;
	text: string;
	timestamp: Date;
	terminalId?: string;
}

let transcriptionHistory = $state<TranscriptionEntry[]>([]);

export function transcriptionHistoryAdd(text: string, terminalId?: string) {
	transcriptionHistory = [
		{
			id: crypto.randomUUID(),
			terminalId,
			text,
			timestamp: new Date(),
		},
		...transcriptionHistory,
	].slice(0, 100);
}

export function transcriptionHistoryGet(): TranscriptionEntry[] {
	return transcriptionHistory;
}

export const TERMINAL_COLOR_OPTIONS = [
	null,
	"#ff3333",
	"#ff6b35",
	"#ffb000",
	"#00ff41",
	"#00e5ff",
	"#6366f1",
	"#a855f7",
	"#ec4899",
] as const;

export type TerminalColor = (typeof TERMINAL_COLOR_OPTIONS)[number];
