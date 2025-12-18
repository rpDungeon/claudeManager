import type { ITheme } from "@xterm/xterm";

export enum TerminalPtyMessageType {
	Error = "error",
	Exit = "exit",
	Output = "output",
}

export type TerminalPtyMessageOutput = {
	data: string;
	type: TerminalPtyMessageType.Output;
};

export type TerminalPtyMessageExit = {
	code: number;
	type: TerminalPtyMessageType.Exit;
};

export type TerminalPtyMessageError = {
	message: string;
	type: TerminalPtyMessageType.Error;
};

export type TerminalPtyMessage = TerminalPtyMessageError | TerminalPtyMessageExit | TerminalPtyMessageOutput;

export type TerminalPtyClientInput = {
	data: string;
	type: "input";
};

export type TerminalPtyClientResize = {
	cols: number;
	rows: number;
	type: "resize";
};

export type TerminalPtyClientMessage = TerminalPtyClientInput | TerminalPtyClientResize;

export const terminalThemeCrt: ITheme = {
	background: "#0a0a0a",
	black: "#0a0a0a",
	blue: "#0066ff",
	brightBlack: "#333333",
	brightBlue: "#0099ff",
	brightCyan: "#00e5ff",
	brightGreen: "#00ff41",
	brightMagenta: "#ff00ff",
	brightRed: "#ff3333",
	brightWhite: "#ffffff",
	brightYellow: "#ffb000",
	cursor: "#00ff41",
	cursorAccent: "#0a0a0a",
	cyan: "#00e5ff",
	foreground: "#e0e0e0",
	green: "#00ff41",
	magenta: "#cc00cc",
	red: "#ff3333",
	selectionBackground: "#00ff4140",
	selectionForeground: "#ffffff",
	selectionInactiveBackground: "#00ff4120",
	white: "#e0e0e0",
	yellow: "#ffb000",
};

export function terminalPtyMessageParse(data: string): TerminalPtyMessage | null {
	try {
		const parsed = JSON.parse(data);
		if (
			parsed &&
			typeof parsed === "object" &&
			"type" in parsed &&
			Object.values(TerminalPtyMessageType).includes(parsed.type)
		) {
			return parsed as TerminalPtyMessage;
		}
		return null;
	} catch {
		return null;
	}
}
