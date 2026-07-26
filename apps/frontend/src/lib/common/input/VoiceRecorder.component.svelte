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
	onpointerdown?: () => void;
	onStopAndSend?: () => void;
}

let {
	state: recorderState = VoiceRecorderState.Idle,
	disabled = false,
	onpointerdown,
	onStopAndSend,
}: Props = $props();
let lastHandledAt = 0;
let rootRef: HTMLDivElement | undefined = $state();

const stateClass = $derived(voiceRecorderStateClasses[recorderState]);
const isDisabled = $derived(disabled || recorderState === VoiceRecorderState.Processing);
const isRecording = $derived(recorderState === VoiceRecorderState.Recording);

function interactionStop(event: Event) {
	event.preventDefault();
	event.stopPropagation();
	if ("stopImmediatePropagation" in event) {
		event.stopImmediatePropagation();
	}
}

function shouldHandleInteraction() {
	const now = Date.now();
	if (now - lastHandledAt < 350) return false;
	lastHandledAt = now;
	return true;
}

function handleRecord(event: Event) {
	interactionStop(event);
	if (isDisabled) return;
	if (!shouldHandleInteraction()) return;
	onpointerdown?.();
}

function handleStopAndSend(event: Event) {
	interactionStop(event);
	if (isDisabled) return;
	if (!shouldHandleInteraction()) return;
	onStopAndSend?.();
}

function handlePrimaryAction(event: Event) {
	const target = event.target;
	const isStopAndSend = target instanceof Element && target.closest("[data-stop-and-send]") !== null;
	if (isStopAndSend) {
		handleStopAndSend(event);
	} else {
		handleRecord(event);
	}
}

function isInsideRoot(clientX: number, clientY: number) {
	if (!rootRef) return false;
	const rect = rootRef.getBoundingClientRect();
	return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function handleDocumentPointer(event: PointerEvent) {
	if (isInsideRoot(event.clientX, event.clientY)) {
		if (event.type === "pointerdown") {
			handlePrimaryAction(event);
		} else {
			interactionStop(event);
		}
	}
}

function handleDocumentMouse(event: MouseEvent) {
	if (isInsideRoot(event.clientX, event.clientY)) {
		if (event.type === "click") {
			handlePrimaryAction(event);
		} else {
			interactionStop(event);
		}
	}
}

function handleDocumentTouch(event: TouchEvent) {
	const touch = event.touches[0] ?? event.changedTouches[0];
	if (touch && isInsideRoot(touch.clientX, touch.clientY)) {
		if (event.type === "touchstart") {
			handlePrimaryAction(event);
		} else {
			interactionStop(event);
		}
	}
}

$effect(() => {
	if (!rootRef) return;
	const captureOptions = {
		capture: true,
	};
	const touchCaptureOptions = {
		capture: true,
		passive: false,
	};
	document.addEventListener("pointerdown", handleDocumentPointer, {
		capture: true,
	});
	document.addEventListener("pointerup", handleDocumentPointer, captureOptions);
	document.addEventListener("pointercancel", handleDocumentPointer, captureOptions);
	document.addEventListener("mousedown", handleDocumentMouse, captureOptions);
	document.addEventListener("mouseup", handleDocumentMouse, captureOptions);
	document.addEventListener("click", handleDocumentMouse, captureOptions);
	document.addEventListener("touchstart", handleDocumentTouch, {
		capture: true,
		passive: false,
	});
	document.addEventListener("touchend", handleDocumentTouch, touchCaptureOptions);
	document.addEventListener("touchcancel", handleDocumentTouch, touchCaptureOptions);
	return () => {
		document.removeEventListener("pointerdown", handleDocumentPointer, {
			capture: true,
		});
		document.removeEventListener("pointerup", handleDocumentPointer, captureOptions);
		document.removeEventListener("pointercancel", handleDocumentPointer, captureOptions);
		document.removeEventListener("mousedown", handleDocumentMouse, captureOptions);
		document.removeEventListener("mouseup", handleDocumentMouse, captureOptions);
		document.removeEventListener("click", handleDocumentMouse, captureOptions);
		document.removeEventListener("touchstart", handleDocumentTouch, {
			capture: true,
		});
		document.removeEventListener("touchend", handleDocumentTouch, touchCaptureOptions);
		document.removeEventListener("touchcancel", handleDocumentTouch, touchCaptureOptions);
	};
});
</script>

<div
	bind:this={rootRef}
	class="flex flex-col items-center gap-3 sm:gap-2"
	onclick={interactionStop}
	onmousedown={interactionStop}
	onmouseup={interactionStop}
	onkeydown={interactionStop}
	onpointerdown={interactionStop}
	onpointerup={interactionStop}
	role="presentation"
	ontouchend={interactionStop}
	ontouchstart={interactionStop}
>
	{#if isRecording}
		<button
			type="button"
			data-stop-and-send
			class="flex size-14 sm:size-8 items-center justify-center rounded-full transition-all duration-150
				bg-terminal-green/20 text-terminal-green border border-terminal-green shadow-[0_0_12px_var(--color-terminal-green)/40]
				hover:bg-terminal-green/30 cursor-pointer touch-manipulation"
			onclickcapture={handleStopAndSend}
			onclick={handleStopAndSend}
			onmousedown={interactionStop}
			onmouseup={interactionStop}
			onpointerdowncapture={handleStopAndSend}
			onpointerdown={handleStopAndSend}
			onpointerup={interactionStop}
			ontouchend={interactionStop}
			ontouchstartcapture={handleStopAndSend}
			ontouchstart={handleStopAndSend}
			aria-label="Stop recording and send"
			title="Stop and send"
		>
			<svg
				class="size-8 sm:size-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M22 2L11 13" />
				<path d="M22 2L15 22L11 13L2 9L22 2Z" />
			</svg>
		</button>
	{/if}

	<button
		type="button"
		disabled={isDisabled}
		class="relative flex size-14 sm:size-8 items-center justify-center rounded-full transition-all duration-150 touch-manipulation
			{stateClass}
			{isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
		onclickcapture={handleRecord}
		onclick={handleRecord}
		onmousedown={interactionStop}
		onmouseup={interactionStop}
		onpointerdowncapture={handleRecord}
		onpointerdown={handleRecord}
		onpointerup={interactionStop}
		ontouchend={interactionStop}
		ontouchstartcapture={handleRecord}
		ontouchstart={handleRecord}
		aria-label={isRecording ? "Recording... Click to stop" : "Click to record"}
	>
		{#if recorderState === VoiceRecorderState.Processing}
			<span class="size-5 sm:size-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
		{:else}
			<svg
				class="size-8 sm:size-4"
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
</div>
