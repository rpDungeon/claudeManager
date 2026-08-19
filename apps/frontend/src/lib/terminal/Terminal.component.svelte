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
import TerminalFooter from "./footer/TerminalFooter.component.svelte";
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
	terminalInstanceScrollPage,
	terminalInstanceSelectAll,
	terminalDisplayTitleGet,
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
import {
	terminalShortcutsGet,
	terminalShortcutsLoad,
	terminalShortcutsIsLoaded,
} from "./shortcut/terminalShortcut.service.svelte";
import {
	settingsTerminalFooterExpandedGet,
	settingsTerminalFooterExpandedSet,
} from "$lib/settings/settings.service.svelte";

interface Props {
	terminalId?: TerminalId;
	title?: string | Snippet;
	titleIsCustom?: boolean;
	info?: string | Snippet;
	itemId?: string;
	isActive?: boolean;
	autoConnect?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	onpointerdown?: (event: MouseEvent) => void;
	onHeaderClick?: (event: MouseEvent) => void;
	onBodyClick?: (event: MouseEvent) => void;
	onClose?: () => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

interface RecordingDownload {
	fileName: string;
	id: string;
	url: string;
}

let {
	terminalId,
	title = "shell",
	titleIsCustom = false,
	info,
	itemId,
	isActive = false,
	autoConnect = true,
	draggable = false,
	isDropTarget = false,
	onpointerdown,
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
let isFooterExpanded = $state(settingsTerminalFooterExpandedGet());
let copyFlash = $state(false);
let scrollLockEnabled = $derived(terminalId ? terminalScrollLockGet(terminalId) : false);
const footerShortcuts = $derived(terminalShortcutsGet());
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingDownloads = $state<RecordingDownload[]>([]);

let contextMenuPosition = $state<ContextMenuPosition | null>(null);
let hasSelection = $state(false);
let borderColor = $state<string | null>(null);

function portalToBody(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		},
	};
}

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
		items.push(
			{
				id: TerminalContextMenuAction.Copy,
				label: "Copy",
				shortcut: "Ctrl+C",
				type: ContextMenuItemType.Action,
			},
			{
				id: TerminalContextMenuAction.CopyPasteEnter,
				label: "Copy & Paste & Enter \u23CE",
				type: ContextMenuItemType.Action,
			},
		);
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
const outputIdle = $derived(instance?.outputIdle ?? false);
const automaticTitle = $derived(instance?.windowTitle ?? instance?.screenTitle ?? null);
const terminalTitle = $derived(
	typeof title === "string" ? terminalDisplayTitleGet(title, titleIsCustom, automaticTitle) : title,
);

const displayTitle = $derived.by(() => {
	const baseTitle = typeof terminalTitle === "string" ? terminalTitle : null;
	if (!(baseTitle && foregroundProcess)) return terminalTitle;
	if (
		foregroundProcess === "bash" ||
		foregroundProcess === "zsh" ||
		foregroundProcess === "fish" ||
		foregroundProcess === "sh"
	) {
		return terminalTitle;
	}
	return `${baseTitle} - ${foregroundProcess}`;
});

const statusColor = $derived.by(() => {
	switch (connectionStatus) {
		case TerminalConnectionStatus.Connected:
			return outputIdle ? IndicatorDotColor.Gray : IndicatorDotColor.Green;
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
	onpointerdown?.(event);
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
		case TerminalContextMenuAction.CopyPasteEnter:
			void terminalInstanceCopySelection(id)
				.then(() => {
					return navigator.clipboard.readText();
				})
				.then((text) => {
					if (text) {
						terminalInstancePaste(id, `${text}\r`);
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

type VoiceStopIntent = "transcribe" | "transcribeAndSend" | "save";
let voiceStopIntent: VoiceStopIntent = "transcribe";

function handleVoiceStopAndSend() {
	if (voiceRecorderState === VoiceRecorderState.Recording && mediaRecorder) {
		voiceStopIntent = "transcribeAndSend";
		mediaRecorder.stop();
	}
}

function handleVoiceStopAndSave() {
	if (voiceRecorderState === VoiceRecorderState.Recording && mediaRecorder) {
		voiceStopIntent = "save";
		mediaRecorder.stop();
	}
}

function recordingExtensionGet(mimeType: string): string {
	if (mimeType.includes("mp4")) return "mp4";
	if (mimeType.includes("mpeg")) return "mp3";
	if (mimeType.includes("ogg")) return "ogg";
	if (mimeType.includes("wav")) return "wav";
	return "webm";
}

function recordingDownloadAdd(audioBlob: Blob, mimeType: string): RecordingDownload {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const recordingDownload = {
		fileName: `transcription-${timestamp}.${recordingExtensionGet(mimeType)}`,
		id: crypto.randomUUID(),
		url: URL.createObjectURL(audioBlob),
	};
	recordingDownloads = [
		recordingDownload,
		...recordingDownloads,
	];
	return recordingDownload;
}

function recordingDownloadDiscard(recordingDownloadId: string) {
	const recordingDownload = recordingDownloads.find((item) => item.id === recordingDownloadId);
	if (!recordingDownload) return;
	recordingDownloads = recordingDownloads.filter((item) => item.id !== recordingDownloadId);
	URL.revokeObjectURL(recordingDownload.url);
}

function handleRecordingDownload(event: MouseEvent, recordingDownloadId: string) {
	event.stopPropagation();
	const recordingDownload = recordingDownloads.find((item) => item.id === recordingDownloadId);
	if (!recordingDownload) return;
	setTimeout(() => {
		recordingDownloads = recordingDownloads.filter((item) => item.id !== recordingDownloadId);
	}, 0);
	setTimeout(() => URL.revokeObjectURL(recordingDownload.url), 1000);
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

function handleScrollPage(event: Event, direction: number) {
	event.preventDefault();
	event.stopPropagation();
	if (terminalId) {
		terminalInstanceScrollPage(terminalId, direction);
	}
}

async function handleVoiceToggle() {
	if (voiceRecorderState === VoiceRecorderState.Recording) {
		if (mediaRecorder) {
			voiceStopIntent = "transcribe";
			mediaRecorder.stop();
		}
		return;
	}

	if (voiceRecorderState !== VoiceRecorderState.Idle) return;
	voiceStopIntent = "transcribe";

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
			const stopIntent = voiceStopIntent;

			if (audioStream) {
				for (const track of audioStream.getTracks()) {
					track.stop();
				}
				audioStream = null;
			}

			if (audioChunks.length === 0) {
				voiceStopIntent = "transcribe";
				voiceRecorderState = VoiceRecorderState.Idle;
				return;
			}

			voiceRecorderState = VoiceRecorderState.Processing;
			const recordingMimeType = mediaRecorder?.mimeType || mimeType || "audio/webm";
			const audioBlob = new Blob(audioChunks, {
				type: recordingMimeType,
			});
			const recordingDownload = recordingDownloadAdd(audioBlob, recordingMimeType);

			if (stopIntent === "save") {
				try {
					const { data, error } = await api.transcription.save.post({
						audio: new File(
							[
								audioBlob,
							],
							recordingDownload.fileName,
							{
								type: recordingMimeType,
							},
						),
						terminalId: recordingTerminalId,
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
						console.error("[VoiceRecorder] Save error:", errorMsg);
					} else {
						recordingDownloadDiscard(recordingDownload.id);
					}
				} catch (err) {
					console.error("[VoiceRecorder] Save failed:", err);
				} finally {
					voiceStopIntent = "transcribe";
					voiceRecorderState = VoiceRecorderState.Idle;
				}
				return;
			}

			try {
				const { data, error } = await api.transcription.post({
					audio: new File(
						[
							audioBlob,
						],
						recordingDownload.fileName,
						{
							type: recordingMimeType,
						},
					),
					terminalId: recordingTerminalId,
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
					const text = data.transcription.trim();
					transcriptionHistoryAdd(text, recordingTerminalId, data.recording.id);

					const targetId = recordingTerminalId;
					terminalInstancePaste(targetId, text);
					terminalInstanceFocus(targetId);

					if (stopIntent === "transcribeAndSend") {
						setTimeout(() => {
							terminalInstancePaste(targetId, "\r");
						}, 500);
					}
					recordingDownloadDiscard(recordingDownload.id);
				}
			} catch (err) {
				console.error("[VoiceRecorder] Transcription failed:", err);
			} finally {
				voiceStopIntent = "transcribe";
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

function handleShortcutClick(
	shortcut: import("@claude-manager/common/src/terminal/shortcut/terminalShortcut.types").TerminalShortcut,
) {
	if (!terminalId) return;
	const id = terminalId;
	if (shortcut.sendCtrlC) {
		terminalInstancePaste(id, "\x03");
		setTimeout(() => {
			terminalInstancePaste(id, "\x03");
			setTimeout(() => {
				terminalInstancePaste(id, shortcut.command);
				if (shortcut.sendEnter) {
					setTimeout(() => terminalInstancePaste(id, "\r"), 50);
				}
				terminalInstanceFocus(id);
			}, 50);
		}, 50);
	} else {
		terminalInstancePaste(id, shortcut.command);
		if (shortcut.sendEnter) {
			setTimeout(() => terminalInstancePaste(id, "\r"), 50);
		}
		terminalInstanceFocus(id);
	}
}

onMount(() => {
	console.log("[Terminal] onMount:", terminalId);
	if (!terminalShortcutsIsLoaded()) {
		void terminalShortcutsLoad();
	}
});

onDestroy(() => {
	console.log("[Terminal] onDestroy:", terminalId);
	for (const recordingDownload of recordingDownloads) {
		URL.revokeObjectURL(recordingDownload.url);
	}
	resizeObserver?.disconnect();
	if (terminalId) {
		terminalInstanceDestroy(terminalId);
	}
});
</script>

{#snippet recordingDownloadButtons()}
	{#if recordingDownloads.length > 0}
		<div class="flex flex-col items-end gap-2">
			{#each recordingDownloads as recordingDownload (recordingDownload.id)}
				<a
				href={recordingDownload.url}
				download={recordingDownload.fileName}
				class="flex h-12 md:h-8 items-center gap-2 rounded-full border border-terminal-amber bg-bg-elevated/95 px-3 text-[11px] md:text-[10px] text-terminal-amber shadow-[0_0_10px_rgba(255,176,0,0.2)] backdrop-blur transition-colors hover:bg-terminal-amber/15 touch-manipulation"
				onpointerdown={(event) => event.stopPropagation()}
				onclick={(event) => handleRecordingDownload(event, recordingDownload.id)}
				title="Download recording audio"
				>
					<svg
						class="size-5 md:size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3v12" />
						<path d="m7 10 5 5 5-5" />
						<path d="M5 21h14" />
					</svg>
					<span>Download audio</span>
				</a>
			{/each}
		</div>
	{/if}
{/snippet}

<div class="relative flex h-full flex-col">
  <TerminalHeader
    title={displayTitle}
    {info}
    {itemId}
    {isActive}
    {statusColor}
    {draggable}
    {isDropTarget}
    onpointerdown={handleHeaderClick}
    onStatusClick={terminalId ? handleStatusClick : undefined}
    {onDragStart}
    {onDragEnd}
    {onDrop}
  />
  <TerminalBody
    {isActive}
    {borderColor}
    onpointerdown={handleBodyClick}
    oncontextmenu={handleContextMenu}
    onMount={handleBodyMount}
  />
  <TerminalFooter
    isExpanded={isFooterExpanded}
    shortcuts={footerShortcuts}
    onToggle={() => {
      isFooterExpanded = !isFooterExpanded;
      settingsTerminalFooterExpandedSet(isFooterExpanded);
    }}
    onShortcutClick={handleShortcutClick}
  />

  {#if terminalId}
    <button
      type="button"
      class="absolute top-0 right-0 z-10 flex h-5 w-5 items-center justify-center text-[8px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors"
      class:text-terminal-green={isSidebarOpen}
      class:bg-bg-elevated={isSidebarOpen}
      onpointerdown={() => (isSidebarOpen = !isSidebarOpen)}
      title="Toggle activity panel"
    >
      ◀
    </button>

    <TerminalSidebar
      {terminalId}
      isOpen={isSidebarOpen}
      onclose={() => (isSidebarOpen = false)}
      onColorChange={handleColorChange}
      onCopyViewport={handleCopyViewport}
      {copyFlash}
    />

    {#if isActive}
    <div use:portalToBody class="pointer-events-auto fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+2rem)] z-[2147483647] flex flex-col items-end gap-3 md:hidden">
      <div class="flex flex-col gap-2 md:hidden">
        <button
          type="button"
          class="flex size-12 touch-manipulation items-center justify-center rounded-full border border-border-default bg-bg-elevated/90 text-terminal-green shadow-[0_0_10px_rgba(0,255,65,0.18)] backdrop-blur transition-colors active:bg-terminal-green/20"
          onpointerdown={(event) => handleScrollPage(event, -1)}
          aria-label="Scroll chat up"
          title="Scroll chat up"
        >
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5" />
            <path d="M5 12L12 5L19 12" />
          </svg>
        </button>
        <button
          type="button"
          class="flex size-12 touch-manipulation items-center justify-center rounded-full border border-border-default bg-bg-elevated/90 text-terminal-green shadow-[0_0_10px_rgba(0,255,65,0.18)] backdrop-blur transition-colors active:bg-terminal-green/20"
          onpointerdown={(event) => handleScrollPage(event, 1)}
          aria-label="Scroll chat down"
          title="Scroll chat down"
        >
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5V19" />
            <path d="M5 12L12 19L19 12" />
          </svg>
        </button>
      </div>
      {@render recordingDownloadButtons()}
      <VoiceRecorder
        state={voiceRecorderState}
        onpointerdown={handleVoiceToggle}
        onStopAndSend={handleVoiceStopAndSend}
        onStopAndSave={handleVoiceStopAndSave}
      />
    </div>
    {/if}

    <div class="pointer-events-auto absolute bottom-3 right-3 z-30 hidden md:flex flex-col items-end gap-2">
      {@render recordingDownloadButtons()}
      <VoiceRecorder
        state={voiceRecorderState}
        onpointerdown={handleVoiceToggle}
        onStopAndSend={handleVoiceStopAndSend}
        onStopAndSave={handleVoiceStopAndSave}
      />
    </div>

    <button
      type="button"
      class="absolute bottom-0.5 right-0.5 z-10 size-1.5 rounded-tl opacity-40 hover:opacity-100 transition-opacity"
      class:bg-terminal-amber={scrollLockEnabled}
      class:bg-text-tertiary={!scrollLockEnabled}
      onpointerdown={handleScrollLockToggle}
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
