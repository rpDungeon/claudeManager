<script lang="ts">
import { GitBranch, ArrowUp, ArrowDown } from "lucide-svelte";

interface Props {
	branch: string | null;
	ahead?: number;
	behind?: number;
	isConnected?: boolean;
}

let { branch, ahead = 0, behind = 0, isConnected = false }: Props = $props();
</script>

<div class="flex h-5 items-center gap-2 border-b border-border-default px-2">
	<GitBranch class="size-3 text-text-tertiary" />
	<span class="text-[10px] font-medium text-text-primary">
		{branch ?? "Not a git repository"}
	</span>
	{#if ahead > 0}
		<span class="flex items-center gap-0.5 text-[10px] text-terminal-green">
			<ArrowUp class="size-3" />
			{ahead}
		</span>
	{/if}
	{#if behind > 0}
		<span class="flex items-center gap-0.5 text-[10px] text-terminal-amber">
			<ArrowDown class="size-3" />
			{behind}
		</span>
	{/if}
	<span class="ml-auto size-1.5 rounded-full {isConnected ? 'bg-terminal-green' : 'bg-terminal-red'}"></span>
</div>
