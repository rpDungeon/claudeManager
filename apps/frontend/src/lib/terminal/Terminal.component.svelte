<!-- Review pending by Autumnlight -->
<!--
@component
name: Terminal
type: smart
styleguide: 1.0.0
description: Complete terminal pane combining header and body with CRT aesthetic
usage: Pass terminalId to connect to PTY backend, or use without for display-only mode
-->
<script lang="ts">
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import type { Snippet } from "svelte";
import { onMount, onDestroy } from "svelte";
import TerminalBody from "./body/TerminalBody.component.svelte";
import TerminalHeader from "./header/TerminalHeader.component.svelte";
import {
	terminalInstanceCreate,
	terminalInstanceDestroy,
	terminalInstanceFit,
	terminalInstanceFocus,
	terminalInstanceGet,
	terminalInstanceMount,
	terminalInstancePaste,
	terminalWebsocketConnect,
} from "./terminal.service.svelte";
import { TerminalConnectionStatus } from "./terminal.lib";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import VoiceRecorder from "$lib/common/input/VoiceRecorder.component.svelte";
import { VoiceRecorderState } from "$lib/common/input/voiceRecorder.lib";
import { api } from "$lib/api/api.client";

interface Props {
	terminalId?: TerminalId;
	title?: string | Snippet;
	info?: string | Snippet;
	itemId?: string;
	isActive?: boolean;
	autoConnect?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	terminalId,
	title = "shell",
	info,
	itemId,
	isActive = false,
	autoConnect = true,
	draggable = false,
	isDropTarget = false,
	onclick,
	onHeaderClick,
	onBodyClick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

let resizeObserver: ResizeObserver | undefined;
let mountCount = 0;
let voiceRecorderState = $state(VoiceRecorderState.Idle);
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

const instance = $derived(terminalId ? terminalInstanceGet(terminalId) : undefined);
const connectionStatus = $derived(instance?.connectionStatus ?? TerminalConnectionStatus.Disconnected);

const statusColor = $derived.by(() => {
	switch (connectionStatus) {
		case TerminalConnectionStatus.Connected:
			return IndicatorDotColor.Green;
		case TerminalConnectionStatus.Connecting:
			return IndicatorDotColor.Amber;
		case TerminalConnectionStatus.Error:
			return IndicatorDotColor.Red;
		default:
			return IndicatorDotColor.Gray;
	}
});

let hasConnected = false;

function handleBodyMount(container: HTMLDivElement) {
	mountCount++;
	console.log("[Terminal] handleBodyMount:", terminalId, "count:", mountCount, "hasConnected:", hasConnected);

	if (!terminalId) return;

	if (hasConnected) {
		console.log("[Terminal] Already connected, skipping");
		return;
	}

	const inst = terminalInstanceGet(terminalId);
	if (!inst) {
		console.log("[Terminal] No instance yet, creating...");
		terminalInstanceCreate(terminalId);
	}

	terminalInstanceMount(terminalId, container);

	if (!resizeObserver) {
		resizeObserver = new ResizeObserver(() => {
			if (terminalId && terminalInstanceGet(terminalId)?.websocket) {
				terminalInstanceFit(terminalId);
			}
		});
		resizeObserver.observe(container);
	}

	if (autoConnect && !hasConnected) {
		console.log("[Terminal] autoConnect, calling websocketConnect");
		hasConnected = true;
		terminalWebsocketConnect(terminalId);
	}
}

function handleClick(event: MouseEvent) {
	onclick?.(event);
}

function handleHeaderClick(event: MouseEvent) {
	handleClick(event);
	onHeaderClick?.(event);
}

function handleBodyClick(event: MouseEvent) {
	handleClick(event);
	onBodyClick?.(event);
	if (terminalId) {
		terminalInstanceFocus(terminalId);
	}
}

let audioStream: MediaStream | null = null;

async function handleVoiceToggle() {
	if (voiceRecorderState === VoiceRecorderState.Recording) {
		if (mediaRecorder) {
			mediaRecorder.stop();
		}
		return;
	}

	if (voiceRecorderState !== VoiceRecorderState.Idle) return;

	try {
		audioStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		mediaRecorder = new MediaRecorder(audioStream, {
			mimeType: "audio/webm",
		});
		audioChunks = [];

		mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) {
				audioChunks.push(e.data);
			}
		};

		mediaRecorder.onstop = async () => {
			if (audioStream) {
				for (const track of audioStream.getTracks()) {
					track.stop();
				}
				audioStream = null;
			}

			if (audioChunks.length === 0) {
				voiceRecorderState = VoiceRecorderState.Idle;
				return;
			}

			voiceRecorderState = VoiceRecorderState.Processing;
			const audioBlob = new Blob(audioChunks, {
				type: "audio/webm",
			});

			try {
				const { data, error } = await api.transcription.post({
					audio: new File(
						[
							audioBlob,
						],
						"recording.webm",
						{
							type: "audio/webm",
						},
					),
				});

				if (error || !data) {
					console.error("[VoiceRecorder] Transcription error:", error);
				} else if (terminalId) {
					terminalInstancePaste(terminalId, data.transcription);
					terminalInstanceFocus(terminalId);
				}
			} catch (err) {
				console.error("[VoiceRecorder] Transcription failed:", err);
			} finally {
				voiceRecorderState = VoiceRecorderState.Idle;
			}
		};

		mediaRecorder.start();
		voiceRecorderState = VoiceRecorderState.Recording;
	} catch (err) {
		console.error("[VoiceRecorder] Failed to access microphone:", err);
		voiceRecorderState = VoiceRecorderState.Idle;
	}
}

onMount(() => {
	console.log("[Terminal] onMount:", terminalId);
});

onDestroy(() => {
	console.log("[Terminal] onDestroy:", terminalId);
	resizeObserver?.disconnect();
	if (terminalId) {
		terminalInstanceDestroy(terminalId);
	}
});
</script>

<div class="relative flex h-full flex-col">
	<TerminalHeader
		{title}
		{info}
		{itemId}
		{isActive}
		{statusColor}
		{draggable}
		{isDropTarget}
		onclick={handleHeaderClick}
		{onDragStart}
		{onDragEnd}
		{onDrop}
	/>
	<TerminalBody
		{isActive}
		onclick={handleBodyClick}
		onMount={handleBodyMount}
	/>

	{#if terminalId}
		<div class="absolute bottom-3 right-3 z-10">
			<VoiceRecorder
				state={voiceRecorderState}
				onclick={handleVoiceToggle}
			/>
		</div>
	{/if}
</div>
