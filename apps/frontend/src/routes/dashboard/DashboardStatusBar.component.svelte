<!--
@component
name: DashboardStatusBar
type: smart
styleguide: 1.0.0
description: Status bar displaying system stats, terminal count, and time
usage: Place at bottom of dashboard to show live system metrics
-->
<script lang="ts">
import { onMount } from "svelte";
import StatusBar from "$lib/statusBar/StatusBar.component.svelte";
import StatusBarItem from "$lib/statusBar/_StatusBarItem.svelte";
import StatusBarSeparator from "$lib/statusBar/_StatusBarSeparator.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";
import { api, authTokenQueryGet } from "$lib/api/api.client";
import { Settings, Columns2, AlignJustify, LogOut } from "lucide-svelte";
import { goto } from "$app/navigation";
import { diffSettings, DiffViewMode } from "$lib/git/diffSettings.svelte";
import GeneralSettingsModal from "./GeneralSettingsModal.component.svelte";

let currentTime = $state(new Date().toLocaleTimeString());
let cpuPercent = $state(0);
let memoryPercent = $state(0);
let ptyCount = $state(0);
let isConnected = $state(false);
let settingsOpen = $state(false);

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30_000;

onMount(() => {
	let ws: ReturnType<typeof api.ws.system.stats.subscribe> | null = null;
	let reconnectAttempt = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let isDestroyed = false;

	function connect() {
		if (isDestroyed) return;

		ws = api.ws.system.stats.subscribe({
			query: authTokenQueryGet(),
		});

		ws.on("open", () => {
			isConnected = true;
			reconnectAttempt = 0;
		});

		ws.subscribe((message) => {
			cpuPercent = message.data.cpuPercentage;
			memoryPercent = message.data.memory.usedPercentage;
			ptyCount = message.data.ptyCount;
		});

		ws.on("error", (error) => {
			console.error("[StatusBar] WebSocket error:", error);
		});

		ws.on("close", () => {
			isConnected = false;
			ws = null;
			scheduleReconnect();
		});
	}

	function scheduleReconnect() {
		if (isDestroyed || reconnectTimeout) return;

		const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
		reconnectAttempt++;
		console.log(`[StatusBar] Reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);

		reconnectTimeout = setTimeout(() => {
			reconnectTimeout = null;
			connect();
		}, delay);
	}

	connect();

	const timeInterval = setInterval(() => {
		currentTime = new Date().toLocaleTimeString();
	}, 1000);

	return () => {
		isDestroyed = true;
		if (reconnectTimeout) clearTimeout(reconnectTimeout);
		ws?.close();
		clearInterval(timeInterval);
	};
});

function formatPercent(value: number): string {
	return value.toFixed(1).padStart(4, "0");
}

const cpuFormatted = $derived(formatPercent(cpuPercent));
const memFormatted = $derived(formatPercent(memoryPercent));

const cpuIndicator = $derived(
	cpuPercent > 80 ? IndicatorDotColor.Red : cpuPercent > 50 ? IndicatorDotColor.Amber : IndicatorDotColor.Green,
);

const memIndicator = $derived(
	memoryPercent > 80 ? IndicatorDotColor.Red : memoryPercent > 50 ? IndicatorDotColor.Amber : IndicatorDotColor.Green,
);

const connectionIndicator = $derived(isConnected ? IndicatorDotColor.Green : IndicatorDotColor.Red);

function handleLogout() {
	localStorage.removeItem("auth_token");
	goto("/login");
}
</script>

<StatusBar>
	{#snippet left()}
		<StatusBarItem indicator={connectionIndicator}>{ptyCount} terminals</StatusBarItem>
		<StatusBarSeparator />
		<StatusBarItem indicator={cpuIndicator}>CPU {cpuFormatted}%</StatusBarItem>
		<StatusBarSeparator />
		<StatusBarItem indicator={memIndicator}>MEM {memFormatted}%</StatusBarItem>
	{/snippet}
	{#snippet right()}
		<button
			type="button"
			onclick={() => diffSettings.toggle()}
			class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
			title={diffSettings.mode === DiffViewMode.Inline ? "Switch to split diff" : "Switch to inline diff"}
		>
			{#if diffSettings.mode === DiffViewMode.Inline}
				<AlignJustify class="size-3" />
				<span>Inline</span>
			{:else}
				<Columns2 class="size-3" />
				<span>Split</span>
			{/if}
		</button>
		<StatusBarSeparator />
		<StatusBarItem>{currentTime}</StatusBarItem>
		<button
			type="button"
			onclick={() => (settingsOpen = true)}
			class="-ml-2 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
			title="Settings"
		>
			<Settings class="size-3" />
		</button>
		<button
			type="button"
			onclick={handleLogout}
			class="flex items-center justify-center text-text-tertiary hover:text-terminal-red transition-colors"
			title="Logout"
		>
			<LogOut class="size-3" />
		</button>
	{/snippet}
</StatusBar>

<GeneralSettingsModal bind:open={settingsOpen} />
