<!--
@component
name: TerminalSidebar
type: smart
styleguide: 1.0.0
description: Slide-in sidebar overlay for terminal with tabbed content
usage: Display terminal activity logs and other info in a sliding panel
-->
<script lang="ts">
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import type { TerminalInputLogEntry } from "@claude-manager/common/src/terminal/terminalInputLog.ws.types";
import {
	type TranscriptionRecording,
	TranscriptionRecordingStatus,
} from "@claude-manager/common/src/transcription/transcription.types";
import { onDestroy } from "svelte";
import {
	TerminalSidebarTab,
	TERMINAL_COLOR_OPTIONS,
	type TerminalColor,
	transcriptionHistoryGet,
	type TranscriptionEntry,
} from "./terminalSidebar.lib.svelte";
import { claudeSessionHistoryGet } from "../statusLine/claudeSessionHistory.service.svelte";
import { api, authTokenQueryGet, backendUrl } from "$lib/api/api.client";
import { terminalInstancePaste } from "../terminal.service.svelte";

type EdenWebSocket = ReturnType<ReturnType<typeof api.ws.terminal>["input-logs"]["subscribe"]>;

interface Props {
	terminalId: TerminalId;
	isOpen: boolean;
	onclose: () => void;
	onColorChange?: (color: TerminalColor) => void;
	onCopyViewport?: () => void;
	copyFlash?: boolean;
}

let { terminalId, isOpen, onclose, onColorChange, onCopyViewport, copyFlash = false }: Props = $props();

let activeTab = $state(TerminalSidebarTab.Activity);
let inputLogs = $state<TerminalInputLogEntry[]>([]);
let isLoading = $state(true);
let websocket: EdenWebSocket | null = null;
let currentColor = $state<TerminalColor>(null);
let isLoadingSettings = $state(false);
let copiedId = $state<string | null>(null);
let transcriptionRecordings = $state<TranscriptionRecording[]>([]);
let transcriptionRecordingsError = $state("");
let transcriptionRecordingsLoading = $state(false);
let transcriptionRecordingActionId = $state<string | null>(null);

function handleResume(sessionId: string) {
	terminalInstancePaste(terminalId, `claude --resume ${sessionId}\r`);
	onclose();
}

function transcriptions(): TranscriptionEntry[] {
	const persistedIds = new Set(transcriptionRecordings.map((recording) => recording.id));
	return transcriptionHistoryGet().filter((entry) => !(entry.recordingId && persistedIds.has(entry.recordingId)));
}

async function transcriptionCopy(id: string, text: string) {
	await navigator.clipboard.writeText(text);
	copiedId = id;
	setTimeout(() => {
		if (copiedId === id) copiedId = null;
	}, 2000);
}

async function transcriptionRecordingsLoad() {
	if (transcriptionRecordings.length === 0) {
		transcriptionRecordingsLoading = true;
	}
	try {
		const { data, error } = await api.transcription.get({
			query: {
				limit: 100,
				terminalId,
			},
		});
		if (error || !data) {
			transcriptionRecordingsError = "Could not load saved recordings";
			return;
		}
		transcriptionRecordings = data;
		transcriptionRecordingsError = "";
	} catch {
		transcriptionRecordingsError = "Could not load saved recordings";
	} finally {
		transcriptionRecordingsLoading = false;
	}
}

async function transcriptionRecordingRegenerate(recordingId: string) {
	transcriptionRecordingActionId = recordingId;
	transcriptionRecordingsError = "";
	try {
		const { error } = await api
			.transcription({
				recordingId,
			})
			.regenerate.post();
		if (error) {
			transcriptionRecordingsError = "Regeneration failed. Audio remains saved.";
		}
		await transcriptionRecordingsLoad();
	} catch {
		transcriptionRecordingsError = "Regeneration failed. Audio remains saved.";
	} finally {
		transcriptionRecordingActionId = null;
	}
}

async function transcriptionRecordingDownload(recording: TranscriptionRecording) {
	transcriptionRecordingActionId = recording.id;
	transcriptionRecordingsError = "";
	try {
		const token = localStorage.getItem("auth_token");
		const response = await fetch(`${backendUrl}/transcription/${recording.id}/audio`, {
			headers: token
				? {
						authorization: `Bearer ${token}`,
					}
				: undefined,
		});
		if (!response.ok) {
			transcriptionRecordingsError = "Download failed. Audio remains saved.";
			return;
		}
		const url = URL.createObjectURL(await response.blob());
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = recording.audioFileName;
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	} catch {
		transcriptionRecordingsError = "Download failed. Audio remains saved.";
	} finally {
		transcriptionRecordingActionId = null;
	}
}

function transcriptionRecordingSizeFormat(sizeBytes: number): string {
	if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function connectWebSocket() {
	if (websocket || !terminalId) return;

	isLoading = true;
	inputLogs = [];

	websocket = api.ws
		.terminal({
			terminalId,
		})
		["input-logs"].subscribe({
			query: authTokenQueryGet(),
		});

	websocket.subscribe((event) => {
		const message = event.data;

		if (message.type === "initial") {
			inputLogs = message.logs;
			isLoading = false;
		} else if (message.type === "new") {
			inputLogs = [
				...inputLogs,
				message.log,
			];
		}
	});

	websocket.on("error", () => {
		console.error("[TerminalSidebar] WebSocket error");
		isLoading = false;
	});

	websocket.on("close", () => {
		websocket = null;
	});
}

function disconnectWebSocket() {
	if (websocket) {
		websocket.close();
		websocket = null;
	}
}

$effect(() => {
	let recordingRefreshInterval: ReturnType<typeof setInterval> | undefined;
	if (isOpen && terminalId) {
		if (activeTab === TerminalSidebarTab.Activity) {
			connectWebSocket();
		} else {
			disconnectWebSocket();
		}
		if (activeTab === TerminalSidebarTab.Transcriptions) {
			void transcriptionRecordingsLoad();
			recordingRefreshInterval = setInterval(() => void transcriptionRecordingsLoad(), 5000);
		}
		if (activeTab === TerminalSidebarTab.Settings) {
			void loadTerminalSettings();
		}
	} else {
		disconnectWebSocket();
	}
	return () => {
		if (recordingRefreshInterval) clearInterval(recordingRefreshInterval);
	};
});

onDestroy(() => {
	disconnectWebSocket();
});

function handleBackdropClick(event: MouseEvent) {
	if (event.target === event.currentTarget) {
		onclose();
	}
}

function formatTimestamp(timestamp: Date | string) {
	const date = new Date(timestamp);
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		hour12: false,
		minute: "2-digit",
		second: "2-digit",
	});
}

function formatInput(input: string): string {
	return input;
}

async function loadTerminalSettings() {
	if (!terminalId) return;

	isLoadingSettings = true;
	try {
		const { data, error } = await api
			.terminals({
				id: terminalId,
			})
			.get();
		if (!error && data) {
			currentColor = (data.color as TerminalColor) ?? null;
		}
	} finally {
		isLoadingSettings = false;
	}
}

async function handleColorSelect(color: TerminalColor) {
	if (!terminalId) return;

	currentColor = color;
	onColorChange?.(color);

	await api
		.terminals({
			id: terminalId,
		})
		.patch({
			color,
		});
}
</script>

<div
  class="pointer-events-none absolute inset-0 z-20 overflow-hidden"
  class:pointer-events-auto={isOpen}
  onpointerdown={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onclose()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div
    class="absolute right-0 top-0 bottom-0 w-[min(18rem,100%)] bg-bg-surface border-l border-border-default transition-transform duration-200 ease-out pointer-events-auto"
    class:translate-x-0={isOpen}
    class:translate-x-full={!isOpen}
  >
    <div class="flex h-full flex-col">
      <div class="flex h-5 items-center border-b border-border-default">
        <button
          type="button"
          class="flex-1 h-full px-3 text-[10px] font-medium transition-colors"
          class:text-terminal-green={activeTab === TerminalSidebarTab.Activity}
          class:bg-bg-elevated={activeTab === TerminalSidebarTab.Activity}
          class:text-text-tertiary={activeTab !== TerminalSidebarTab.Activity}
          onpointerdown={() => (activeTab = TerminalSidebarTab.Activity)}
        >
          Activity
        </button>
        <button
          type="button"
          class="flex-1 h-full px-3 text-[10px] font-medium transition-colors border-l border-border-default"
          class:text-terminal-green={activeTab ===
            TerminalSidebarTab.Transcriptions}
          class:bg-bg-elevated={activeTab === TerminalSidebarTab.Transcriptions}
          class:text-text-tertiary={activeTab !==
            TerminalSidebarTab.Transcriptions}
          onpointerdown={() => (activeTab = TerminalSidebarTab.Transcriptions)}
        >
          Voice
        </button>
        <button
          type="button"
          class="flex-1 h-full px-3 text-[10px] font-medium transition-colors border-l border-border-default"
          class:text-terminal-green={activeTab === TerminalSidebarTab.Claude}
          class:bg-bg-elevated={activeTab === TerminalSidebarTab.Claude}
          class:text-text-tertiary={activeTab !== TerminalSidebarTab.Claude}
          onpointerdown={() => (activeTab = TerminalSidebarTab.Claude)}
        >
          Claude
        </button>
        <button
          type="button"
          class="flex-1 h-full px-3 text-[10px] font-medium transition-colors border-l border-border-default"
          class:text-terminal-green={activeTab === TerminalSidebarTab.Settings}
          class:bg-bg-elevated={activeTab === TerminalSidebarTab.Settings}
          class:text-text-tertiary={activeTab !== TerminalSidebarTab.Settings}
          onpointerdown={() => (activeTab = TerminalSidebarTab.Settings)}
        >
          Settings
        </button>
        {#if onCopyViewport}
          <button
            type="button"
            class="flex h-full w-6 items-center justify-center text-[10px] transition-colors border-l border-border-default"
            class:text-terminal-green={copyFlash}
            class:text-text-tertiary={!copyFlash}
            class:hover:text-terminal-green={!copyFlash}
            class:hover:bg-bg-elevated={!copyFlash}
            onpointerdown={onCopyViewport}
            title="Copy viewport to clipboard"
          >
            ⎘
          </button>
        {/if}
        <button
          type="button"
          class="flex h-full w-6 items-center justify-center text-[10px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors border-l border-border-default"
          onpointerdown={onclose}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div class="activity-scroll flex-1 overflow-y-auto">
        {#if activeTab === TerminalSidebarTab.Activity}
          {#if isLoading}
            <div
              class="flex items-center justify-center p-4 text-[10px] text-text-tertiary"
            >
              Loading...
            </div>
          {:else if inputLogs.length === 0}
            <div
              class="flex items-center justify-center p-4 text-[10px] text-text-tertiary"
            >
              No activity yet
            </div>
          {:else}
            <div class="flex flex-col-reverse">
              {#each inputLogs as log (log.id)}
                <div
                  class="border-b border-border-default px-2 py-1 hover:bg-bg-elevated"
                >
                  <div class="flex items-baseline gap-2">
                    <span
                      class="text-[9px] text-text-tertiary font-mono shrink-0"
                    >
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span
                      class="text-[10px] text-text-primary font-mono break-all"
                    >
                      {formatInput(log.input)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === TerminalSidebarTab.Transcriptions}
          {@const sessionItems = transcriptions()}
          {#if transcriptionRecordingsError}
            <div class="border-b border-terminal-red/30 bg-terminal-red/10 px-2 py-1.5 text-[9px] text-terminal-red">
              {transcriptionRecordingsError}
            </div>
          {/if}
          {#if transcriptionRecordingsLoading && transcriptionRecordings.length === 0 && sessionItems.length === 0}
            <div
              class="flex items-center justify-center p-4 text-[10px] text-text-tertiary"
            >
              Loading saved recordings...
            </div>
          {:else if transcriptionRecordings.length === 0 && sessionItems.length === 0}
            <div class="flex items-center justify-center p-4 text-[10px] text-text-tertiary">
              No voice recordings yet
            </div>
          {:else}
            <div class="flex flex-col">
              {#each transcriptionRecordings as recording (recording.id)}
                <div class="border-b border-border-default px-2 py-2 hover:bg-bg-elevated group">
                  <div class="mb-1 flex items-center gap-2 text-[9px] font-mono text-text-tertiary">
                    <span>{formatTimestamp(recording.createdAt)}</span>
                    <span>{transcriptionRecordingSizeFormat(recording.sizeBytes)}</span>
                    <span
                      class:text-terminal-green={recording.status === TranscriptionRecordingStatus.Complete}
                      class:text-terminal-red={recording.status === TranscriptionRecordingStatus.Failed}
                      class:text-terminal-amber={recording.status === TranscriptionRecordingStatus.Processing}
                      class:text-terminal-cyan={recording.status === TranscriptionRecordingStatus.Untranscribed}
                    >
                      {recording.status}
                    </span>
                  </div>
                  {#if recording.transcription}
                    <div class="mb-2 text-[10px] text-text-primary font-mono break-words whitespace-pre-wrap">
                      {recording.transcription}
                    </div>
                  {:else if recording.status === TranscriptionRecordingStatus.Untranscribed}
                    <div class="mb-2 text-[10px] text-terminal-cyan font-mono">
                      Untranscribed audio saved.
                    </div>
                  {:else if recording.error}
                    <div class="mb-2 text-[10px] text-terminal-red font-mono break-words whitespace-pre-wrap">
                      {recording.error}
                    </div>
                  {:else}
                    <div class="mb-2 text-[10px] text-terminal-amber font-mono">
                      Processing audio...
                    </div>
                  {/if}
                  <div class="flex flex-wrap items-center gap-1.5">
                    {#if recording.transcription}
                      <button
                        type="button"
                        class="px-1.5 py-0.5 text-[9px] rounded bg-bg-elevated text-text-secondary hover:text-terminal-green transition-colors"
                        class:bg-terminal-green={copiedId === recording.id}
                        class:text-bg-void={copiedId === recording.id}
                        onpointerdown={() => void transcriptionCopy(recording.id, recording.transcription ?? "")}
                      >
                        {copiedId === recording.id ? "Copied" : "Copy"}
                      </button>
                    {/if}
                    <button
                      type="button"
                      disabled={transcriptionRecordingActionId === recording.id}
                      class="px-1.5 py-0.5 text-[9px] rounded bg-bg-elevated text-text-secondary hover:text-terminal-amber transition-colors disabled:opacity-50"
                      onpointerdown={() => void transcriptionRecordingDownload(recording)}
                    >
                      Download audio
                    </button>
                    <button
                      type="button"
                      disabled={transcriptionRecordingActionId === recording.id}
                      class="px-1.5 py-0.5 text-[9px] rounded bg-terminal-green/15 text-terminal-green hover:bg-terminal-green/25 transition-colors disabled:opacity-50"
                      onpointerdown={() => void transcriptionRecordingRegenerate(recording.id)}
                    >
                      {transcriptionRecordingActionId === recording.id ? "Working..." : "Regenerate"}
                    </button>
                  </div>
                </div>
              {/each}
              {#each sessionItems as entry (entry.id)}
                <div
                  class="border-b border-border-default px-2 py-2 hover:bg-bg-elevated group"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="text-[9px] text-text-tertiary font-mono mb-1">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                      <div
                        class="text-[10px] text-text-primary font-mono break-words whitespace-pre-wrap"
                      >
                        {entry.text}
                      </div>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 px-1.5 py-0.5 text-[9px] rounded transition-colors"
                      class:bg-terminal-green={copiedId === entry.id}
                      class:text-bg-void={copiedId === entry.id}
                      class:bg-bg-elevated={copiedId !== entry.id}
                       class:text-text-secondary={copiedId !== entry.id}
                       class:hover:text-terminal-green={copiedId !== entry.id}
                       onpointerdown={() => void transcriptionCopy(entry.id, entry.text)}
                     >
                      {copiedId === entry.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === TerminalSidebarTab.Claude}
          {@const sessions = claudeSessionHistoryGet(terminalId)}
          {#if sessions.length === 0}
            <div class="flex items-center justify-center p-4 text-[10px] text-text-tertiary">
              No Claude sessions detected
            </div>
          {:else}
            <div class="flex flex-col">
              {#each sessions as entry (entry.externalSessionId)}
                <div class="border-b border-border-default px-2 py-2 hover:bg-bg-elevated">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[9px] text-text-tertiary font-mono shrink-0">
                      {entry.externalSessionId.slice(0, 8)}
                    </span>
                    {#if entry.model}
                      <span class="text-[9px] text-cyan-400">{entry.model}</span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2 mb-1.5">
                    {#if entry.branch}
                      <span class="text-[9px] text-text-secondary">{entry.branch}</span>
                    {/if}
                    {#if entry.tokenUsage}
                      <span class="text-[9px] text-amber-400">{entry.tokenUsage}</span>
                    {/if}
                    {#if entry.cost}
                      <span class="text-[9px] text-terminal-green">{entry.cost}</span>
                    {/if}
                  </div>
                  <button
                    type="button"
                    class="w-full h-5 rounded bg-terminal-green/20 border border-terminal-green/40 text-[9px] text-terminal-green font-medium hover:bg-terminal-green/30 transition-colors"
                    onpointerdown={() => handleResume(entry.externalSessionId)}
                  >
                    ▶ Resume
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === TerminalSidebarTab.Settings}
          {#if isLoadingSettings}
            <div
              class="flex items-center justify-center p-4 text-[10px] text-text-tertiary"
            >
              Loading...
            </div>
          {:else}
            <div class="p-3">
              <div class="mb-2 text-[10px] text-text-secondary font-medium">
                Border Color
              </div>
              <div class="flex flex-wrap gap-2">
                {#each TERMINAL_COLOR_OPTIONS as color}
                  <button
                    type="button"
                    class="size-6 rounded border transition-all"
                    class:ring-2={currentColor === color}
                    class:ring-terminal-green={currentColor === color}
                    class:border-border-active={currentColor !== color}
                    class:border-transparent={currentColor === color}
                    style:background-color={color ?? "transparent"}
                    onpointerdown={() => handleColorSelect(color)}
                    title={color ?? "None"}
                  >
                    {#if color === null}
                      <span
                        class="flex items-center justify-center text-[8px] text-text-tertiary"
                        >✕</span
                      >
                    {/if}
                  </button>
                {/each}
              </div>
              <p class="mt-2 text-[9px] text-text-tertiary">
                Set a persistent border color for this terminal
              </p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .activity-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 255, 65, 0.5) rgba(0, 0, 0, 0.3);
  }

  .activity-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .activity-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  .activity-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.5);
    border-radius: 3px;
    box-shadow: 0 0 4px rgba(0, 255, 65, 0.3);
  }

  .activity-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 65, 0.7);
    box-shadow: 0 0 6px rgba(0, 255, 65, 0.5);
  }
</style>
