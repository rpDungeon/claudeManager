// Review pending by Autumnlight
export enum VoiceRecorderState {
	Idle = "idle",
	Recording = "recording",
	Processing = "processing",
}

export const voiceRecorderStateClasses: Record<VoiceRecorderState, string> = {
	[VoiceRecorderState.Idle]:
		"bg-bg-elevated text-text-secondary border border-border-default hover:border-terminal-green hover:text-terminal-green",
	[VoiceRecorderState.Recording]:
		"bg-terminal-red/20 text-terminal-red border border-terminal-red shadow-[0_0_12px_var(--color-terminal-red)/40] animate-pulse",
	[VoiceRecorderState.Processing]:
		"bg-terminal-amber/20 text-terminal-amber border border-terminal-amber/50 cursor-wait",
};
