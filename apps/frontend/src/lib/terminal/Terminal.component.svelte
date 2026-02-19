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
import TerminalSidebar from "./sidebar/TerminalSidebar.component.svelte";
import {
	terminalInstanceCreate,
	terminalInstanceCopySelection,
	terminalInstanceCopyViewport,
	terminalInstanceDestroy,
	terminalInstanceFit,
	terminalInstanceFocus,
	terminalInstanceGet,
	terminalInstanceGetSelection,
	terminalInstanceMount,
	terminalInstancePaste,
	terminalInstanceSelectAll,
	terminalScrollLockGet,
	terminalScrollLockToggle,
	terminalWebsocketConnect,
	terminalWebsocketForceReconnect,
} from "./terminal.service.svelte";
import { TerminalConnectionStatus, TerminalContextMenuAction } from "./terminal.lib";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import ContextMenu from "$lib/common/contextMenu/ContextMenu.component.svelte";
import { ContextMenuItemType } from "$lib/common/contextMenu/contextMenu.lib";
import type { ContextMenuItem, ContextMenuPosition } from "$lib/common/contextMenu/contextMenu.lib";
import VoiceRecorder from "$lib/common/input/VoiceRecorder.component.svelte";
import { VoiceRecorderState } from "$lib/common/input/voiceRecorder.lib";
import { api } from "$lib/api/api.client";
import { transcriptionHistoryAdd } from "./sidebar/terminalSidebar.lib.svelte";

const WHITESPACE_REGEX = /\s+/;

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
	onClose?: () => void;
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
	onClose,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

let resizeObserver: ResizeObserver | undefined;
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
let mountCount = 0;
let voiceRecorderState = $state(VoiceRecorderState.Idle);
let isSidebarOpen = $state(false);
let copyFlash = $state(false);
let scrollLockEnabled = $derived(terminalId ? terminalScrollLockGet(terminalId) : false);
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

let contextMenuPosition = $state<ContextMenuPosition | null>(null);
let hasSelection = $state(false);
let borderColor = $state<string | null>(null);

$effect(() => {
	if (terminalId) {
		api
			.terminals({
				id: terminalId,
			})
			.get()
			.then(({ data }) => {
				if (data) {
					borderColor = data.color ?? null;
				}
			});
	}
});

const contextMenuItems = $derived.by((): ContextMenuItem<TerminalContextMenuAction>[] => {
	const items: ContextMenuItem<TerminalContextMenuAction>[] = [];

	if (hasSelection) {
		items.push({
			id: TerminalContextMenuAction.Copy,
			label: "Copy",
			shortcut: "Ctrl+C",
			type: ContextMenuItemType.Action,
		});
	}

	items.push(
		{
			id: TerminalContextMenuAction.Paste,
			label: "Paste",
			shortcut: "Ctrl+V",
			type: ContextMenuItemType.Action,
		},
		{
			id: TerminalContextMenuAction.SelectAll,
			label: "Select All",
			type: ContextMenuItemType.Action,
		},
		{
			type: ContextMenuItemType.Divider,
		},
		{
			danger: true,
			id: TerminalContextMenuAction.Close,
			label: "Close",
			type: ContextMenuItemType.Action,
		},
	);

	return items;
});

const instance = $derived(terminalId ? terminalInstanceGet(terminalId) : undefined);
const connectionStatus = $derived(instance?.connectionStatus ?? TerminalConnectionStatus.Disconnected);
const foregroundProcess = $derived(instance?.foregroundProcess ?? null);

const displayTitle = $derived.by(() => {
	const baseTitle = typeof title === "string" ? title : null;
	if (!(baseTitle && foregroundProcess)) return title;
	if (
		foregroundProcess === "bash" ||
		foregroundProcess === "zsh" ||
		foregroundProcess === "fish" ||
		foregroundProcess === "sh"
	) {
		return title;
	}
	return `${baseTitle} - ${foregroundProcess}`;
});

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

$effect(() => {
	if (isActive && terminalId) {
		setTimeout(() => {
			terminalInstanceFit(terminalId);
		}, 16);
	}
});

let currentContainer: HTMLDivElement | undefined;

function handleBodyMount(container: HTMLDivElement) {
	mountCount++;
	console.log("[Terminal] handleBodyMount:", terminalId, "count:", mountCount);

	if (!terminalId) return;

	const inst = terminalInstanceGet(terminalId);

	if (inst && inst.container !== container) {
		console.log("[Terminal] Container changed, remounting (keeping connection)");
		terminalInstanceMount(terminalId, container);
	} else if (!inst) {
		console.log("[Terminal] No instance yet, creating...");
		terminalInstanceCreate(terminalId);
		terminalInstanceMount(terminalId, container);
		if (autoConnect) {
			terminalWebsocketConnect(terminalId);
		}
	}

	if (currentContainer !== container) {
		resizeObserver?.disconnect();
		resizeObserver = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				if (terminalId && terminalInstanceGet(terminalId)?.websocket) {
					terminalInstanceFit(terminalId);
				}
			}, 16);
		});
		resizeObserver.observe(container);
		currentContainer = container;
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

function handleStatusClick(_event: MouseEvent) {
	if (terminalId) {
		terminalWebsocketForceReconnect(terminalId);
	}
}

function handleContextMenu(event: MouseEvent) {
	if (!terminalId) return;

	const selection = terminalInstanceGetSelection(terminalId);
	hasSelection = Boolean(selection);

	contextMenuPosition = {
		x: event.clientX,
		y: event.clientY,
	};
}

function handleContextMenuAction(actionId: TerminalContextMenuAction) {
	if (!terminalId) return;

	const id = terminalId;
	switch (actionId) {
		case TerminalContextMenuAction.Copy:
			void terminalInstanceCopySelection(id);
			break;
		case TerminalContextMenuAction.Paste:
			void navigator.clipboard.readText().then((text) => {
				if (text) {
					terminalInstancePaste(id, text);
				}
			});
			break;
		case TerminalContextMenuAction.SelectAll:
			terminalInstanceSelectAll(terminalId);
			break;
		case TerminalContextMenuAction.Close:
			onClose?.();
			break;
	}

	contextMenuPosition = null;
}

function handleContextMenuClose() {
	contextMenuPosition = null;
}

function handleColorChange(color: string | null) {
	borderColor = color;
}

let audioStream: MediaStream | null = null;
let recordingTerminalId: TerminalId | undefined;
let shouldAutoSendOnStop = false;

function handleVoiceStopAndSend() {
	if (voiceRecorderState === VoiceRecorderState.Recording && mediaRecorder) {
		shouldAutoSendOnStop = true;
		mediaRecorder.stop();
	}
}

async function handleCopyViewport() {
	if (!terminalId) return;
	const success = await terminalInstanceCopyViewport(terminalId);
	if (success) {
		copyFlash = true;
		setTimeout(() => {
			copyFlash = false;
		}, 600);
	}
}

function handleScrollLockToggle() {
	if (terminalId) {
		terminalScrollLockToggle(terminalId);
	}
}

async function handleVoiceToggle() {
	if (voiceRecorderState === VoiceRecorderState.Recording) {
		if (mediaRecorder) {
			shouldAutoSendOnStop = false;
			mediaRecorder.stop();
		}
		return;
	}

	if (voiceRecorderState !== VoiceRecorderState.Idle) return;

	try {
		audioStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});

		const mimeType = MediaRecorder.isTypeSupported("audio/webm")
			? "audio/webm"
			: MediaRecorder.isTypeSupported("audio/mp4")
				? "audio/mp4"
				: undefined;

		mediaRecorder = mimeType
			? new MediaRecorder(audioStream, {
					mimeType,
				})
			: new MediaRecorder(audioStream);
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
					const errorMsg =
						typeof error === "object" && error !== null && "error" in error
							? (
									error as {
										error: string;
									}
								).error
							: JSON.stringify(error);
					console.error("[VoiceRecorder] Transcription error:", errorMsg);
				} else if (recordingTerminalId) {
					let text = data.transcription.trim();
					transcriptionHistoryAdd(text, recordingTerminalId);
					let autoSend = shouldAutoSendOnStop;

					if (!autoSend) {
						const words = text.split(WHITESPACE_REGEX);
						const lastWord = words[words.length - 1]?.toLowerCase();

						// Auto-send: saying "send" at the end triggers Enter. Variants handle common transcription errors.
						if (
							lastWord === "send" ||
							lastWord === "send." ||
							lastWord === "cent" ||
							lastWord === "cent." ||
							lastWord === "sent" ||
							lastWord === "sent."
						) {
							words.pop();
							text = words.join(" ");
							autoSend = true;
						}
					}

					const targetId = recordingTerminalId;
					terminalInstancePaste(targetId, text);
					terminalInstanceFocus(targetId);

					if (autoSend) {
						setTimeout(() => {
							terminalInstancePaste(targetId, "\r");
						}, 500);
					}
				}
				shouldAutoSendOnStop = false;
			} catch (err) {
				console.error("[VoiceRecorder] Transcription failed:", err);
			} finally {
				voiceRecorderState = VoiceRecorderState.Idle;
			}
		};

		recordingTerminalId = terminalId;
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
    title={displayTitle}
    {info}
    {itemId}
    {isActive}
    {statusColor}
    {draggable}
    {isDropTarget}
    onclick={handleHeaderClick}
    onStatusClick={terminalId ? handleStatusClick : undefined}
    {onDragStart}
    {onDragEnd}
    {onDrop}
  />
  <TerminalBody
    {isActive}
    {borderColor}
    onclick={handleBodyClick}
    oncontextmenu={handleContextMenu}
    onMount={handleBodyMount}
  />

  {#if terminalId}
    <button
      type="button"
      class="absolute top-0 right-5 z-10 flex h-5 w-5 items-center justify-center text-[8px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors"
      class:text-terminal-green={copyFlash}
      onclick={handleCopyViewport}
      title="Copy viewport to clipboard"
    >
      ⎘
    </button>
    <button
      type="button"
      class="absolute top-0 right-0 z-10 flex h-5 w-5 items-center justify-center text-[8px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors"
      class:text-terminal-green={isSidebarOpen}
      class:bg-bg-elevated={isSidebarOpen}
      onclick={() => (isSidebarOpen = !isSidebarOpen)}
      title="Toggle activity panel"
    >
      ◀
    </button>

    <TerminalSidebar
      {terminalId}
      isOpen={isSidebarOpen}
      onclose={() => (isSidebarOpen = false)}
      onColorChange={handleColorChange}
    />

    <div class="absolute bottom-3 right-3 z-10">
      <VoiceRecorder
        state={voiceRecorderState}
        onclick={handleVoiceToggle}
        onStopAndSend={handleVoiceStopAndSend}
      />
    </div>

    <button
      type="button"
      class="absolute bottom-0.5 right-0.5 z-10 size-1.5 rounded-tl opacity-40 hover:opacity-100 transition-opacity"
      class:bg-terminal-amber={scrollLockEnabled}
      class:bg-text-tertiary={!scrollLockEnabled}
      onclick={handleScrollLockToggle}
      title={scrollLockEnabled
        ? "Auto-scroll ON (click to disable)"
        : "Auto-scroll OFF (click to enable)"}
    ></button>
  {/if}

  {#if contextMenuPosition}
    <ContextMenu
      items={contextMenuItems}
      position={contextMenuPosition}
      onAction={handleContextMenuAction}
      onClose={handleContextMenuClose}
    />
  {/if}
</div>
