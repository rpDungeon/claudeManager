export enum IndicatorDotColor {
	Green = "green",
	Red = "red",
	Amber = "amber",
	Cyan = "cyan",
	Yellow = "yellow",
	White = "white",
	Gray = "gray",
}

export const indicatorDotColorMap: Record<IndicatorDotColor, string> = {
	[IndicatorDotColor.Green]: "bg-terminal-green",
	[IndicatorDotColor.Red]: "bg-terminal-red",
	[IndicatorDotColor.Amber]: "bg-terminal-amber",
	[IndicatorDotColor.Cyan]: "bg-terminal-cyan",
	[IndicatorDotColor.Yellow]: "bg-yellow-400",
	[IndicatorDotColor.White]: "bg-text-primary",
	[IndicatorDotColor.Gray]: "bg-text-tertiary",
};

export const indicatorDotGlowMap: Record<IndicatorDotColor, string> = {
	[IndicatorDotColor.Green]: "shadow-[0_0_6px_var(--color-terminal-green)]",
	[IndicatorDotColor.Red]: "shadow-[0_0_6px_var(--color-terminal-red)]",
	[IndicatorDotColor.Amber]: "shadow-[0_0_6px_var(--color-terminal-amber)]",
	[IndicatorDotColor.Cyan]: "shadow-[0_0_6px_var(--color-terminal-cyan)]",
	[IndicatorDotColor.Yellow]: "shadow-[0_0_6px_#facc15]",
	[IndicatorDotColor.White]: "shadow-[0_0_6px_var(--color-text-primary)]",
	[IndicatorDotColor.Gray]: "",
};
