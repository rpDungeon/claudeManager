<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import StatusBar from "./StatusBar.component.svelte";
import StatusBarItem from "./_StatusBarItem.svelte";
import StatusBarSeparator from "./_StatusBarSeparator.svelte";
import { IndicatorDotColor } from "$lib/common/indicatorDot.lib";

const { Story } = defineMeta({
	component: StatusBar,
	parameters: {
		backgrounds: {
			default: "void",
			values: [
				{
					name: "void",
					value: "#0a0a0a",
				},
			],
		},
		layout: "fullscreen",
	},
	tags: [
		"autodocs",
	],
	title: "Layout/StatusBar",
});
</script>

<Story name="Default" asChild>
	<div class="flex h-screen w-full flex-col bg-bg-void">
		<div class="flex-1"></div>
		<StatusBar>
			{#snippet left()}
				<StatusBarItem indicator={IndicatorDotColor.Green}>4 terminals</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>2 sessions</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>api-server: running 2m 34s</StatusBarItem>
			{/snippet}
			{#snippet right()}
				<StatusBarItem>CPU 12%</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>MEM 2.3GB</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>12:37:45</StatusBarItem>
			{/snippet}
		</StatusBar>
	</div>
</Story>

<Story name="Minimal" asChild>
	<div class="flex h-screen w-full flex-col bg-bg-void">
		<div class="flex-1"></div>
		<StatusBar>
			{#snippet left()}
				<StatusBarItem indicator={IndicatorDotColor.Green}>1 terminal</StatusBarItem>
			{/snippet}
			{#snippet right()}
				<StatusBarItem>14:22:10</StatusBarItem>
			{/snippet}
		</StatusBar>
	</div>
</Story>

<Story name="Idle" asChild>
	<div class="flex h-screen w-full flex-col bg-bg-void">
		<div class="flex-1"></div>
		<StatusBar>
			{#snippet left()}
				<StatusBarItem indicator={IndicatorDotColor.Gray}>0 terminals</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>0 sessions</StatusBarItem>
			{/snippet}
			{#snippet right()}
				<StatusBarItem>CPU 2%</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>MEM 512MB</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>09:00:00</StatusBarItem>
			{/snippet}
		</StatusBar>
	</div>
</Story>

<Story name="Busy" asChild>
	<div class="flex h-screen w-full flex-col bg-bg-void">
		<div class="flex-1"></div>
		<StatusBar>
			{#snippet left()}
				<StatusBarItem indicator={IndicatorDotColor.Green}>8 terminals</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>4 sessions</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>claude-manager: compiling</StatusBarItem>
			{/snippet}
			{#snippet right()}
				<StatusBarItem>CPU 87%</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>MEM 8.2GB</StatusBarItem>
				<StatusBarSeparator />
				<StatusBarItem>23:59:59</StatusBarItem>
			{/snippet}
		</StatusBar>
	</div>
</Story>

<Story name="CustomContent" asChild>
	<div class="flex h-screen w-full flex-col bg-bg-void">
		<div class="flex-1"></div>
		<StatusBar>
			{#snippet left()}
				<StatusBarItem indicator={IndicatorDotColor.Cyan}>
					<span class="text-terminal-cyan">claude</span> session active
				</StatusBarItem>
			{/snippet}
			{#snippet right()}
				<span class="text-terminal-amber">⚡</span>
				<StatusBarItem>Ready</StatusBarItem>
			{/snippet}
		</StatusBar>
	</div>
</Story>
