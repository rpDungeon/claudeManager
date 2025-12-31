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
import { TerminalSidebarTab } from "./terminalSidebar.lib";
import { api } from "$lib/api/api.client";

type EdenWebSocket = ReturnType<ReturnType<typeof api.ws.terminal>["input-logs"]["subscribe"]>;

interface Props {
	terminalId: TerminalId;
	isOpen: boolean;
	onclose: () => void;
}

let { terminalId, isOpen, onclose }: Props = $props();

let activeTab = $state(TerminalSidebarTab.Activity);
let inputLogs = $state<TerminalInputLogEntry[]>([]);
let isLoading = $state(true);
let websocket: EdenWebSocket | null = null;

function connectWebSocket() {
	if (websocket || !terminalId) return;

	isLoading = true;
	inputLogs = [];

	websocket = api.ws
		.terminal({
			terminalId,
		})
		["input-logs"].subscribe();

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
		connectWebSocket();
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
					class="flex h-full w-6 items-center justify-center text-[10px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors border-l border-border-default"
					onclick={onclose}
					title="Close panel"
				>
					✕
				</button>
			</div>

			<div class="flex-1 overflow-y-auto">
				{#if activeTab === TerminalSidebarTab.Activity}
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-[10px] text-text-tertiary">
							Loading...
						</div>
					{:else if inputLogs.length === 0}
						<div class="flex items-center justify-center p-4 text-[10px] text-text-tertiary">
							No activity yet
						</div>
					{:else}
						<div class="flex flex-col-reverse">
							{#each inputLogs as log (log.id)}
								<div class="border-b border-border-default px-2 py-1 hover:bg-bg-elevated">
									<div class="flex items-baseline gap-2">
										<span class="text-[9px] text-text-tertiary font-mono shrink-0">
											{formatTimestamp(log.timestamp)}
										</span>
										<span class="text-[10px] text-text-primary font-mono break-all">
											{formatInput(log.input)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
