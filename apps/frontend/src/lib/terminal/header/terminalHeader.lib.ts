export enum TerminalHeaderStatusColor {
	Green = "green",
	Red = "red",
	Orange = "orange",
	White = "white",
	Blue = "blue",
	Yellow = "yellow",
}

export const terminalHeaderStatusColorMap: Record<TerminalHeaderStatusColor, string> = {
	[TerminalHeaderStatusColor.Green]: "bg-terminal-green shadow-[0_0_6px_var(--color-terminal-green)]",
	[TerminalHeaderStatusColor.Red]: "bg-terminal-red shadow-[0_0_6px_var(--color-terminal-red)]",
	[TerminalHeaderStatusColor.Orange]: "bg-terminal-amber shadow-[0_0_6px_var(--color-terminal-amber)]",
	[TerminalHeaderStatusColor.White]: "bg-text-primary shadow-[0_0_6px_var(--color-text-primary)]",
	[TerminalHeaderStatusColor.Blue]: "bg-terminal-cyan shadow-[0_0_6px_var(--color-terminal-cyan)]",
	[TerminalHeaderStatusColor.Yellow]: "bg-yellow-400 shadow-[0_0_6px_#facc15]",
};
