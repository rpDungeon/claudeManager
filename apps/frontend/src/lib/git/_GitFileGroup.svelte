<script lang="ts">
import { ChevronDown, ChevronRight, Plus, Minus, File } from "lucide-svelte";
import type { GitFileEntry } from "@claude-manager/common/src/git/git.types";
import { gitStatusCodeLabel, gitStatusCodeColor, type GitFileArea } from "./gitPanel.lib";

interface Props {
	title: string;
	files: GitFileEntry[];
	area: GitFileArea;
	onStage?: (filePath: string) => void;
	onUnstage?: (filePath: string) => void;
	onFileClick?: (filePath: string, area: GitFileArea) => void;
}

let { title, files, area, onStage, onUnstage, onFileClick }: Props = $props();

let isExpanded = $state(true);

function handleToggle() {
	isExpanded = !isExpanded;
}

function fileNameGet(path: string): string {
	return path.split("/").pop() ?? path;
}
</script>

{#if files.length > 0}
	<div class="border-b border-border-default">
		<button
			type="button"
			onclick={handleToggle}
			class="flex w-full items-center gap-1.5 px-3 py-1.5 text-left hover:bg-bg-elevated transition-colors"
		>
			{#if isExpanded}
				<ChevronDown class="size-3 text-text-tertiary" />
			{:else}
				<ChevronRight class="size-3 text-text-tertiary" />
			{/if}
			<span class="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
				{title}
			</span>
			<span class="text-[10px] text-text-tertiary">
				({files.length})
			</span>
		</button>

		{#if isExpanded}
			<div class="flex flex-col">
				{#each files as file (file.path)}
					{@const statusCode = area === "staged" ? file.statusIndex : file.statusWorking}
					{@const statusLabel = gitStatusCodeLabel(statusCode)}
					{@const statusColor = gitStatusCodeColor(statusCode)}
					<div
						class="group flex items-center gap-1.5 px-3 py-1 hover:bg-bg-elevated transition-colors cursor-pointer"
					>
						<button
							type="button"
							onclick={() => onFileClick?.(file.path, area)}
							class="flex flex-1 items-center gap-1.5 min-w-0"
							title={file.path}
						>
							<File class="size-3 shrink-0 text-text-tertiary" />
							<span class="text-[11px] text-text-primary shrink-0">
								{fileNameGet(file.path)}
							</span>
							<span class="text-[10px] text-text-tertiary truncate direction-rtl text-left">
								{file.path}
							</span>
						</button>
						<span class="text-[10px] font-medium {statusColor}">
							{statusLabel}
						</span>
						{#if area === "staged"}
							<button
								type="button"
								onclick={() => onUnstage?.(file.path)}
								class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-bg-void transition-all"
								title="Unstage"
							>
								<Minus class="size-3 text-text-secondary" />
							</button>
						{:else}
							<button
								type="button"
								onclick={() => onStage?.(file.path)}
								class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-bg-void transition-all"
								title="Stage"
							>
								<Plus class="size-3 text-text-secondary" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
