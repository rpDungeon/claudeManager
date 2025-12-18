export enum ButtonVariant {
	Primary = "primary",
	Secondary = "secondary",
	Ghost = "ghost",
	Danger = "danger",
}

export enum ButtonSize {
	Sm = "sm",
	Md = "md",
	Lg = "lg",
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
	[ButtonVariant.Primary]:
		"bg-terminal-green text-bg-void hover:bg-terminal-green/90 shadow-[0_0_8px_var(--color-terminal-green)/30]",
	[ButtonVariant.Secondary]:
		"bg-bg-elevated text-text-primary border border-border-default hover:border-border-active hover:bg-bg-surface",
	[ButtonVariant.Ghost]: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
	[ButtonVariant.Danger]: "bg-terminal-red/20 text-terminal-red border border-terminal-red/50 hover:bg-terminal-red/30",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
	[ButtonSize.Sm]: "px-2 py-1 text-[10px]",
	[ButtonSize.Md]: "px-3 py-1.5 text-[11px]",
	[ButtonSize.Lg]: "px-4 py-2 text-xs",
};
