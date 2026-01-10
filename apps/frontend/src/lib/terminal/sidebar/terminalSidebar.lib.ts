export enum TerminalSidebarTab {
	Activity = "activity",
	Settings = "settings",
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
