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
import { api } from "$lib/api/api.client";
import { Settings } from "lucide-svelte";
import GeneralSettingsModal from "./GeneralSettingsModal.component.svelte";

let currentTime = $state(new Date().toLocaleTimeString());
let cpuPercent = $state(0);
let memoryPercent = $state(0);
let ptyCount = $state(0);
let isConnected = $state(false);
let settingsOpen = $state(false);

onMount(() => {
	const ws = api.ws.system.stats.subscribe();

	ws.on("open", () => {
		isConnected = true;
	});

	ws.subscribe((message) => {
		cpuPercent = message.data.cpuPercentage;
		memoryPercent = message.data.memory.usedPercentage;
		ptyCount = message.data.ptyCount;
	});

	ws.on("error", (error) => {
		console.error("[StatusBar] WebSocket error:", error);
	});

	ws.on("close", (_event) => {
		isConnected = false;
	});

	const timeInterval = setInterval(() => {
		currentTime = new Date().toLocaleTimeString();
	}, 1000);

	return () => {
		ws.close();
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
		<StatusBarItem>{currentTime}</StatusBarItem>
		<button
			type="button"
			onclick={() => (settingsOpen = true)}
			class="-ml-2 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
		>
			<Settings class="size-3" />
		</button>
	{/snippet}
</StatusBar>

<GeneralSettingsModal bind:open={settingsOpen} />
