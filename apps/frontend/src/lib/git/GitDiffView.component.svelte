<!--
@component
name: GitDiffView
type: stupid
styleguide: 1.0.0
description: Displays git diff with syntax highlighting for additions/deletions
usage: Used to show file diff when clicking on changed files in git panel
-->
<script lang="ts">
import { diffSettings, DiffViewMode } from "./diffSettings.svelte";

const HUNK_HEADER_REGEX = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

interface Props {
	diff: string;
	filePath: string;
	staged: boolean;
}

let { diff, filePath: _filePath, staged: _staged }: Props = $props();

type DiffLineType = "header" | "hunk" | "addition" | "deletion" | "context";

interface DiffLine {
	content: string;
	type: DiffLineType;
	oldLineNum: number | null;
	newLineNum: number | null;
}

interface SplitLine {
	left: {
		content: string;
		lineNum: number | null;
		type: DiffLineType;
	} | null;
	right: {
		content: string;
		lineNum: number | null;
		type: DiffLineType;
	} | null;
}

function diffLinesParse(diffText: string): DiffLine[] {
	const lines = diffText.split("\n");
	const result: DiffLine[] = [];

	let oldLine = 0;
	let newLine = 0;

	for (const line of lines) {
		if (
			line.startsWith("diff --git") ||
			line.startsWith("index ") ||
			line.startsWith("---") ||
			line.startsWith("+++")
		) {
			result.push({
				content: line,
				newLineNum: null,
				oldLineNum: null,
				type: "header",
			});
		} else if (line.startsWith("@@")) {
			const match = line.match(HUNK_HEADER_REGEX);
			if (match) {
				oldLine = parseInt(match[1], 10);
				newLine = parseInt(match[2], 10);
			}
			result.push({
				content: line,
				newLineNum: null,
				oldLineNum: null,
				type: "hunk",
			});
		} else if (line.startsWith("+")) {
			result.push({
				content: line.slice(1),
				newLineNum: newLine,
				oldLineNum: null,
				type: "addition",
			});
			newLine++;
		} else if (line.startsWith("-")) {
			result.push({
				content: line.slice(1),
				newLineNum: null,
				oldLineNum: oldLine,
				type: "deletion",
			});
			oldLine++;
		} else if (line.startsWith(" ") || line === "") {
			const content = line.startsWith(" ") ? line.slice(1) : line;
			result.push({
				content,
				newLineNum: newLine,
				oldLineNum: oldLine,
				type: "context",
			});
			oldLine++;
			newLine++;
		}
	}

	return result;
}

function diffToSplitLines(lines: DiffLine[]): SplitLine[] {
	const result: SplitLine[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (line.type === "header" || line.type === "hunk") {
			result.push({
				left: {
					content: line.content,
					lineNum: null,
					type: line.type,
				},
				right: {
					content: line.content,
					lineNum: null,
					type: line.type,
				},
			});
			i++;
		} else if (line.type === "context") {
			result.push({
				left: {
					content: line.content,
					lineNum: line.oldLineNum,
					type: "context",
				},
				right: {
					content: line.content,
					lineNum: line.newLineNum,
					type: "context",
				},
			});
			i++;
		} else if (line.type === "deletion") {
			const deletions: DiffLine[] = [];
			const additions: DiffLine[] = [];

			while (i < lines.length && lines[i].type === "deletion") {
				deletions.push(lines[i]);
				i++;
			}
			while (i < lines.length && lines[i].type === "addition") {
				additions.push(lines[i]);
				i++;
			}

			const maxLen = Math.max(deletions.length, additions.length);
			for (let j = 0; j < maxLen; j++) {
				const del = deletions[j];
				const add = additions[j];
				result.push({
					left: del
						? {
								content: del.content,
								lineNum: del.oldLineNum,
								type: "deletion",
							}
						: null,
					right: add
						? {
								content: add.content,
								lineNum: add.newLineNum,
								type: "addition",
							}
						: null,
				});
			}
		} else if (line.type === "addition") {
			result.push({
				left: null,
				right: {
					content: line.content,
					lineNum: line.newLineNum,
					type: "addition",
				},
			});
			i++;
		} else {
			i++;
		}
	}

	return result;
}

const parsedLines = $derived(diffLinesParse(diff));
const splitLines = $derived(diffToSplitLines(parsedLines));

function lineTypeStyleGet(type: DiffLineType): string {
	switch (type) {
		case "header":
			return "text-text-tertiary bg-bg-void";
		case "hunk":
			return "text-terminal-cyan bg-bg-void";
		case "addition":
			return "text-terminal-green bg-terminal-green/10";
		case "deletion":
			return "text-terminal-red bg-terminal-red/10";
		case "context":
			return "text-text-secondary";
		default:
			return "";
	}
}

function splitCellStyle(type: DiffLineType | null): string {
	if (!type) return "bg-bg-void/50";
	return lineTypeStyleGet(type);
}
</script>

<div class="flex h-full flex-col bg-bg-surface">
	<div class="flex-1 overflow-auto font-mono text-[11px]">
		{#if diff.trim() === ""}
			<div class="flex h-full items-center justify-center text-text-tertiary">
				No changes to display
			</div>
		{:else if diffSettings.mode === DiffViewMode.Inline}
			<div class="min-w-max">
				{#each parsedLines as line, i (i)}
					<div class="flex {lineTypeStyleGet(line.type)}">
						<span class="w-12 shrink-0 text-right pr-2 text-text-tertiary select-none border-r border-border-default">
							{line.oldLineNum ?? ""}
						</span>
						<span class="w-12 shrink-0 text-right pr-2 text-text-tertiary select-none border-r border-border-default">
							{line.newLineNum ?? ""}
						</span>
						<span class="w-6 shrink-0 text-center select-none {line.type === 'addition' ? 'text-terminal-green' : line.type === 'deletion' ? 'text-terminal-red' : 'text-text-tertiary'}">
							{line.type === "addition" ? "+" : line.type === "deletion" ? "-" : ""}
						</span>
						<pre class="flex-1 px-2 whitespace-pre">{line.content}</pre>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex min-w-max">
				<div class="flex-1 border-r border-border-active">
					{#each splitLines as line, i (i)}
						<div class="flex {splitCellStyle(line.left?.type ?? null)}">
							<span class="w-12 shrink-0 text-right pr-2 text-text-tertiary select-none border-r border-border-default">
								{line.left?.lineNum ?? ""}
							</span>
							<pre class="flex-1 px-2 whitespace-pre min-h-[1.4em]">{line.left?.content ?? ""}</pre>
						</div>
					{/each}
				</div>
				<div class="flex-1">
					{#each splitLines as line, i (i)}
						<div class="flex {splitCellStyle(line.right?.type ?? null)}">
							<span class="w-12 shrink-0 text-right pr-2 text-text-tertiary select-none border-r border-border-default">
								{line.right?.lineNum ?? ""}
							</span>
							<pre class="flex-1 px-2 whitespace-pre min-h-[1.4em]">{line.right?.content ?? ""}</pre>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
