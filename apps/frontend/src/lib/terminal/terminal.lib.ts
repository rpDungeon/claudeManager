import type { ITheme } from "@xterm/xterm";

export enum TerminalConnectionStatus {
	Connected = "connected",
	Connecting = "connecting",
	Disconnected = "disconnected",
	Error = "error",
}

export enum TerminalContextMenuAction {
	Copy = "copy",
	Paste = "paste",
	SelectAll = "select-all",
	Close = "close",
}

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
	selectionBackground: "#00ff4133",
	selectionInactiveBackground: "#00ff4120",
	white: "#e0e0e0",
	yellow: "#ffb000",
};
