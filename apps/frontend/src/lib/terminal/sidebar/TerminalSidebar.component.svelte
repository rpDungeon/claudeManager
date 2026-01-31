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
import { onDestroy } from "svelte";
import {
	TerminalSidebarTab,
	TERMINAL_COLOR_OPTIONS,
	type TerminalColor,
	transcriptionHistoryGet,
	type TranscriptionEntry,
} from "./terminalSidebar.lib.svelte";
import { api, authTokenQueryGet } from "$lib/api/api.client";

type EdenWebSocket = ReturnType<ReturnType<typeof api.ws.terminal>["input-logs"]["subscribe"]>;

interface Props {
	terminalId: TerminalId;
	isOpen: boolean;
	onclose: () => void;
	onColorChange?: (color: TerminalColor) => void;
}

let { terminalId, isOpen, onclose, onColorChange }: Props = $props();

let activeTab = $state(TerminalSidebarTab.Activity);
let inputLogs = $state<TerminalInputLogEntry[]>([]);
let isLoading = $state(true);
let websocket: EdenWebSocket | null = null;
let currentColor = $state<TerminalColor>(null);
let isLoadingSettings = $state(false);
let copiedId = $state<string | null>(null);

function transcriptions(): TranscriptionEntry[] {
	return transcriptionHistoryGet();
}

async function copyTranscription(entry: TranscriptionEntry) {
	await navigator.clipboard.writeText(entry.text);
	copiedId = entry.id;
	setTimeout(() => {
		if (copiedId === entry.id) copiedId = null;
	}, 2000);
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
	if (isOpen && terminalId) {
		if (activeTab === TerminalSidebarTab.Activity) {
			connectWebSocket();
		} else {
			disconnectWebSocket();
		}
		if (activeTab === TerminalSidebarTab.Settings) {
			loadTerminalSettings();
		}
	} else {
		disconnectWebSocket();
	}
});

onDestroy(() => {
	disconnectWebSocket();
});

function handleBackdropClick(event: MouseEvent) {
	if (event.target === event.currentTarget) {
		onclose();
	}
}

function formatTimestamp(timestamp: Date) {
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
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onclose()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div
    class="absolute right-0 top-0 bottom-0 w-72 bg-bg-surface border-l border-border-default transition-transform duration-200 ease-out pointer-events-auto"
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
          onclick={() => (activeTab = TerminalSidebarTab.Activity)}
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
          onclick={() => (activeTab = TerminalSidebarTab.Transcriptions)}
        >
          Voice
        </button>
        <button
          type="button"
          class="flex-1 h-full px-3 text-[10px] font-medium transition-colors border-l border-border-default"
          class:text-terminal-green={activeTab === TerminalSidebarTab.Settings}
          class:bg-bg-elevated={activeTab === TerminalSidebarTab.Settings}
          class:text-text-tertiary={activeTab !== TerminalSidebarTab.Settings}
          onclick={() => (activeTab = TerminalSidebarTab.Settings)}
        >
          Settings
        </button>
        <button
          type="button"
          class="flex h-full w-6 items-center justify-center text-[10px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors border-l border-border-default"
          onclick={onclose}
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
          {@const items = transcriptions()}
          {#if items.length === 0}
            <div
              class="flex items-center justify-center p-4 text-[10px] text-text-tertiary"
            >
              No transcriptions yet
            </div>
          {:else}
            <div class="flex flex-col">
              {#each items as entry (entry.id)}
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
                      onclick={() => copyTranscription(entry)}
                    >
                      {copiedId === entry.id ? "Copied" : "Copy"}
                    </button>
                  </div>
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
                    onclick={() => handleColorSelect(color)}
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
