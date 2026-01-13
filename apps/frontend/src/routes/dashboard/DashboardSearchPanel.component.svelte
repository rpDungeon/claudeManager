<!--
@component
name: DashboardSearchPanel
type: smart
styleguide: 1.0.0
description: Search panel for finding text across project files
usage: Place in dashboard sidebar to search files in the project
-->
<script lang="ts">
import { api } from "$lib/api/api.client";

interface Props {
	rootPath?: string;
	onFileOpen?: (filePath: string, openToSide?: boolean) => void;
}

let { rootPath = "", onFileOpen }: Props = $props();

let searchQuery = $state("");
let replaceQuery = $state("");
let isReplaceVisible = $state(false);
let isCaseSensitive = $state(false);
let isRegex = $state(false);
let isWholeWord = $state(false);
let isSearching = $state(false);
let results = $state<SearchResult[]>([]);
let expandedFiles = $state<Set<string>>(new Set());

interface SearchMatch {
	line: number;
	column: number;
	text: string;
	matchStart: number;
	matchEnd: number;
}

interface SearchResult {
	filePath: string;
	relativePath: string;
	matches: SearchMatch[];
}

const totalMatches = $derived(results.reduce((sum, r) => sum + r.matches.length, 0));

async function handleSearch() {
	if (!searchQuery.trim() || !rootPath) return;

	isSearching = true;
	results = [];

	try {
		const response = await api.search.post({
			caseSensitive: isCaseSensitive,
			path: rootPath,
			query: searchQuery,
			regex: isRegex,
			wholeWord: isWholeWord,
		});

		if (!response.error && response.data) {
			results = response.data.results as SearchResult[];
			for (const result of results) {
				expandedFiles.add(result.filePath);
			}
			expandedFiles = new Set(expandedFiles);
		}
	} catch (err) {
		console.error("[SearchPanel] Search failed:", err);
	} finally {
		isSearching = false;
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter") {
		void handleSearch();
	}
}

function toggleFileExpanded(filePath: string) {
	if (expandedFiles.has(filePath)) {
		expandedFiles.delete(filePath);
	} else {
		expandedFiles.add(filePath);
	}
	expandedFiles = new Set(expandedFiles);
}

function handleMatchClick(filePath: string, line: number) {
	onFileOpen?.(filePath);
}

function toggleReplace() {
	isReplaceVisible = !isReplaceVisible;
}
</script>

<div class="flex h-full flex-col bg-bg-surface">
	<div class="flex flex-col gap-2 border-b border-border-default p-2">
		<div class="flex items-center gap-1">
			<input
				type="text"
				bind:value={searchQuery}
				onkeydown={handleKeydown}
				placeholder="Search..."
				class="flex-1 h-6 bg-bg-elevated border border-border-default rounded px-2 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-terminal-green"
			/>
			<button
				type="button"
				onclick={toggleReplace}
				class="flex items-center justify-center size-6 rounded border transition-colors
					{isReplaceVisible
					? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
					: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
				title="Toggle Replace"
			>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 3v6" />
					<path d="m8 6 4-3 4 3" />
					<path d="M12 21v-6" />
					<path d="m8 18 4 3 4-3" />
				</svg>
			</button>
		</div>

		{#if isReplaceVisible}
			<input
				type="text"
				bind:value={replaceQuery}
				placeholder="Replace..."
				class="h-6 bg-bg-elevated border border-border-default rounded px-2 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-terminal-green"
			/>
		{/if}

		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={() => (isCaseSensitive = !isCaseSensitive)}
				class="flex items-center justify-center size-6 rounded border text-[10px] font-bold transition-colors
					{isCaseSensitive
					? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
					: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
				title="Match Case"
			>
				Aa
			</button>
			<button
				type="button"
				onclick={() => (isWholeWord = !isWholeWord)}
				class="flex items-center justify-center size-6 rounded border text-[10px] font-bold transition-colors
					{isWholeWord
					? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
					: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
				title="Match Whole Word"
			>
				W
			</button>
			<button
				type="button"
				onclick={() => (isRegex = !isRegex)}
				class="flex items-center justify-center size-6 rounded border text-[10px] font-bold transition-colors
					{isRegex
					? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
					: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
				title="Use Regular Expression"
			>
				.*
			</button>
			<div class="flex-1"></div>
			<button
				type="button"
				onclick={handleSearch}
				disabled={isSearching || !searchQuery.trim()}
				class="flex items-center justify-center h-6 px-2 rounded border text-[10px] transition-colors
					{isSearching
					? 'bg-bg-elevated border-border-default text-text-tertiary cursor-wait'
					: 'bg-bg-elevated border-border-default text-text-secondary hover:border-terminal-green hover:text-terminal-green'}"
			>
				{isSearching ? "..." : "Search"}
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-auto">
		{#if results.length === 0 && !isSearching}
			<div class="flex h-full items-center justify-center text-[10px] text-text-tertiary">
				{searchQuery.trim() ? "No results" : "Enter a search term"}
			</div>
		{:else if isSearching}
			<div class="flex h-full items-center justify-center text-[10px] text-text-tertiary">
				Searching...
			</div>
		{:else}
			<div class="text-[10px] text-text-tertiary px-2 py-1 border-b border-border-default">
				{totalMatches} result{totalMatches !== 1 ? "s" : ""} in {results.length} file{results.length !== 1 ? "s" : ""}
			</div>
			<div class="py-1">
				{#each results as result (result.filePath)}
					<div>
						<button
							type="button"
							onclick={() => toggleFileExpanded(result.filePath)}
							class="flex items-center gap-1 w-full px-2 py-0.5 text-left text-[11px] text-text-secondary hover:bg-bg-elevated transition-colors"
						>
							<span class="text-text-tertiary">
								{expandedFiles.has(result.filePath) ? "▼" : "▶"}
							</span>
							<span class="truncate flex-1">{result.relativePath}</span>
							<span class="text-text-tertiary">{result.matches.length}</span>
						</button>
						{#if expandedFiles.has(result.filePath)}
							<div class="ml-4">
								{#each result.matches as match, index (index)}
									<button
										type="button"
										onclick={() => handleMatchClick(result.filePath, match.line)}
										class="flex items-start gap-2 w-full px-2 py-0.5 text-left text-[10px] hover:bg-bg-elevated transition-colors"
									>
										<span class="text-text-tertiary shrink-0">{match.line}:</span>
										<span class="text-text-secondary truncate">
											{@html highlightMatch(match.text, match.matchStart, match.matchEnd)}
										</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<script module lang="ts">
function highlightMatch(text: string, start: number, end: number): string {
	const before = escapeHtml(text.slice(0, start));
	const match = escapeHtml(text.slice(start, end));
	const after = escapeHtml(text.slice(end));
	return `${before}<span class="bg-terminal-amber/30 text-terminal-amber">${match}</span>${after}`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
</script>
