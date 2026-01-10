<!--
@component
name: QuickOpen
type: smart
styleguide: 1.0.0
description: VS Code-style Quick Open modal with fuzzy file search
usage: Open with Ctrl+P for file search, : for go to line, @ for symbols
-->
<script lang="ts">
import type { FsFileListItem } from "@claude-manager/common/src/fs/fs.types";
import { Dialog } from "bits-ui";
import fuzzysort from "fuzzysort";
import { Search } from "lucide-svelte";
import { untrack } from "svelte";
import { commandRegistry } from "$lib/command/command.lib";
import {
	QuickOpenMode,
	quickOpenFuzzySearchFiles,
	quickOpenModeConfig,
	quickOpenModeDetect,
	quickOpenParseLineNumber,
	type QuickOpenResult,
} from "./quickOpen.lib";
import { quickOpenDocumentSymbolsGet, quickOpenFileIndexLoad, quickOpenProjectsLoad } from "./quickOpen.service.svelte";
import QuickOpenResultItem from "./_QuickOpenResultItem.svelte";

interface Props {
	activeEditorId?: string | null;
	initialMode?: QuickOpenMode;
	onFileSelect?: (filePath: string, line?: number) => void;
	onLineSelect?: (line: number) => void;
	onProjectSelect?: (projectId: string, layoutId: string | null) => void;
	open?: boolean;
	projectPath: string;
}

let {
	activeEditorId = null,
	initialMode = QuickOpenMode.File,
	onFileSelect,
	onLineSelect,
	onProjectSelect,
	open = $bindable(false),
	projectPath,
}: Props = $props();

let query = $state("");
let selectedIndex = $state(0);
let isLoading = $state(false);
let files = $state<FsFileListItem[]>([]);
let documentSymbols = $state<QuickOpenResult[]>([]);
let projects = $state<QuickOpenResult[]>([]);
let resultsContainer: HTMLDivElement | undefined = $state();
let inputRef: HTMLInputElement | undefined = $state();

const { cleanQuery, mode } = $derived(quickOpenModeDetect(query));
const config = $derived(quickOpenModeConfig[mode]);

const results = $derived.by((): QuickOpenResult[] => {
	if (mode === QuickOpenMode.File) {
		return quickOpenFuzzySearchFiles(cleanQuery, files);
	}
	if (mode === QuickOpenMode.Line) {
		const lineNum = quickOpenParseLineNumber(cleanQuery);
		if (lineNum) {
			return [
				{
					id: `line-${lineNum}`,
					line: lineNum,
					primary: `Go to line ${lineNum}`,
					type: QuickOpenMode.Line,
				},
			];
		}
		return [];
	}
	if (mode === QuickOpenMode.Symbol) {
		if (!cleanQuery.trim()) {
			return documentSymbols;
		}
		const filtered = fuzzysort.go(cleanQuery, documentSymbols, {
			key: "primary",
			limit: 50,
			threshold: 0.2,
		});
		return filtered.map((r) => r.obj);
	}
	if (mode === QuickOpenMode.Project) {
		if (!cleanQuery.trim()) {
			return projects;
		}
		const filtered = fuzzysort.go(cleanQuery, projects, {
			key: "primary",
			limit: 50,
			threshold: 0.2,
		});
		return filtered.map((r) => r.obj);
	}
	if (mode === QuickOpenMode.Command) {
		const commands = commandRegistry.search(cleanQuery);
		return commands.map((cmd) => ({
			id: cmd.id,
			keybinding: cmd.keybinding,
			primary: cmd.title,
			secondary: cmd.category,
			type: QuickOpenMode.Command,
		}));
	}
	return [];
});

$effect(() => {
	if (open && projectPath) {
		isLoading = true;
		untrack(() => {
			void quickOpenFileIndexLoad(projectPath).then((loadedFiles) => {
				files = loadedFiles;
				isLoading = false;
			});
		});
	}
});

$effect(() => {
	if (open && activeEditorId && mode === QuickOpenMode.Symbol) {
		isLoading = true;
		untrack(() => {
			void quickOpenDocumentSymbolsGet(activeEditorId).then((symbols) => {
				documentSymbols = symbols;
				isLoading = false;
			});
		});
	}
});

$effect(() => {
	if (open && mode === QuickOpenMode.Project) {
		isLoading = true;
		untrack(() => {
			void quickOpenProjectsLoad().then((loadedProjects) => {
				projects = loadedProjects;
				isLoading = false;
			});
		});
	}
});

$effect(() => {
	if (open) {
		const prefillModes = [
			QuickOpenMode.Line,
			QuickOpenMode.Symbol,
			QuickOpenMode.Project,
		];
		query = prefillModes.includes(initialMode) ? quickOpenModeConfig[initialMode].prefix : "";
		selectedIndex = 0;
		documentSymbols = [];
		projects = [];
		setTimeout(() => inputRef?.focus(), 0);
	}
});

$effect(() => {
	void results;
	selectedIndex = 0;
});

$effect(() => {
	if (resultsContainer && results.length > 0) {
		const selected = resultsContainer.children[selectedIndex] as HTMLElement | undefined;
		selected?.scrollIntoView({
			block: "nearest",
		});
	}
});

function handleKeyDown(event: KeyboardEvent) {
	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
			break;
		case "ArrowUp":
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			break;
		case "Enter":
			event.preventDefault();
			selectResult(results[selectedIndex]);
			break;
	}
}

function selectResult(result: QuickOpenResult | undefined) {
	if (!result) return;

	switch (result.type) {
		case QuickOpenMode.File:
			onFileSelect?.(result.id, result.line);
			break;
		case QuickOpenMode.Line:
			if (result.line) {
				onLineSelect?.(result.line);
			}
			break;
		case QuickOpenMode.Symbol:
			if (result.line) {
				onLineSelect?.(result.line);
			}
			break;
		case QuickOpenMode.Project:
			onProjectSelect?.(result.id, result.layoutId ?? null);
			break;
		case QuickOpenMode.Command:
			commandRegistry.execute(result.id);
			break;
	}

	open = false;
}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 border border-border-default bg-bg-surface shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
			onkeydown={handleKeyDown}
		>
			<Dialog.Title class="sr-only">Quick Open</Dialog.Title>
			<Dialog.Description class="sr-only">
				Search for files, go to line, or find symbols
			</Dialog.Description>

			<div class="flex items-center gap-2 border-b border-border-default px-3 py-2">
				<Search class="size-4 text-text-tertiary" />
				{#if config.prefix}
					<span class="text-terminal-green">{config.prefix}</span>
				{/if}
				<input
					bind:this={inputRef}
					type="text"
					bind:value={query}
					placeholder={config.placeholder}
					class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
				/>
				{#if isLoading}
					<span class="text-xs text-text-tertiary">Loading...</span>
				{/if}
			</div>

			<div bind:this={resultsContainer} class="max-h-80 overflow-y-auto">
				{#if results.length === 0}
					<div class="px-3 py-8 text-center text-sm text-text-tertiary">
						{config.emptyMessage}
					</div>
				{:else}
					{#each results as result, index (result.id)}
						<QuickOpenResultItem
							{result}
							isSelected={index === selectedIndex}
							onclick={() => selectResult(result)}
						/>
					{/each}
				{/if}
			</div>

			<div class="flex items-center justify-between border-t border-border-default px-3 py-1.5 text-[10px] text-text-tertiary">
				<div class="flex items-center gap-3">
					<span><kbd class="rounded bg-bg-elevated px-1">↑↓</kbd> navigate</span>
					<span><kbd class="rounded bg-bg-elevated px-1">↵</kbd> select</span>
					<span><kbd class="rounded bg-bg-elevated px-1">esc</kbd> close</span>
				</div>
				<div class="flex items-center gap-3">
					<span><kbd class="rounded bg-bg-elevated px-1">&gt;</kbd> command</span>
					<span><kbd class="rounded bg-bg-elevated px-1">:</kbd> line</span>
					<span><kbd class="rounded bg-bg-elevated px-1">@</kbd> symbol</span>
					<span><kbd class="rounded bg-bg-elevated px-1">#</kbd> project</span>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
