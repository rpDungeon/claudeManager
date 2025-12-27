<!-- Review pending by Autumnlight -->
<!--
@component
name: VoiceRecorder
type: stupid
styleguide: 1.0.0
description: Microphone button for recording audio with visual state feedback
usage: Click to start recording, click again to stop. Toggle mode.
-->
<script lang="ts">
import { VoiceRecorderState, voiceRecorderStateClasses } from "./voiceRecorder.lib";

interface Props {
	state?: VoiceRecorderState;
	disabled?: boolean;
	onclick?: () => void;
}

let { state = VoiceRecorderState.Idle, disabled = false, onclick }: Props = $props();

const stateClass = $derived(voiceRecorderStateClasses[state]);
const isDisabled = $derived(disabled || state === VoiceRecorderState.Processing);
const isRecording = $derived(state === VoiceRecorderState.Recording);

function handleClick() {
	if (isDisabled) return;
	onclick?.();
}
</script>

<button
	type="button"
	disabled={isDisabled}
	class="relative flex size-8 items-center justify-center rounded-full transition-all duration-150
		{stateClass}
		{isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	onclick={handleClick}
	aria-label={isRecording ? "Recording... Click to stop" : "Click to record"}
>
	{#if state === VoiceRecorderState.Processing}
		<span class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
	{:else}
		<svg
			class="size-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
			<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
			<line x1="12" x2="12" y1="19" y2="22" />
		</svg>
	{/if}

	{#if isRecording}
		<span class="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-terminal-red animate-ping"></span>
		<span class="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-terminal-red"></span>
	{/if}
</button>
