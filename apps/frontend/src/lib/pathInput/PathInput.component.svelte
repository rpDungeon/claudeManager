<!--
@component
name: PathInput
type: smart
styleguide: 1.0.0
description: Directory path input with autocomplete dropdown showing valid directories
usage: Use for selecting filesystem paths with validation
-->
<script lang="ts">
import { FsEntryType, type FsEntry } from "@claude-manager/common/src/fs/fs.types";
import { Folder, AlertCircle, Check } from "lucide-svelte";
import { api } from "$lib/api/api.client";

interface Props {
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	onchange?: (value: string) => void;
	onvalidchange?: (isValid: boolean) => void;
}

let {
	value = $bindable(""),
	placeholder = "/path/to/directory",
	disabled = false,
	onchange,
	onvalidchange,
}: Props = $props();

let inputRef: HTMLInputElement | undefined = $state();
let isOpen = $state(false);
let isLoading = $state(false);
let suggestions = $state<FsEntry[]>([]);
let selectedIndex = $state(-1);
let isValid = $state<boolean | null>(null);
let validationTimeout: ReturnType<typeof setTimeout> | null = null;

const dirPath = $derived(() => {
	if (!value) return "/";
	const lastSlash = value.lastIndexOf("/");
	if (lastSlash === -1) return "/";
	return value.slice(0, lastSlash + 1) || "/";
});

const filterText = $derived(() => {
	if (!value) return "";
	const lastSlash = value.lastIndexOf("/");
	if (lastSlash === -1) return value;
	return value.slice(lastSlash + 1);
});

const filteredSuggestions = $derived(
	suggestions
		.filter((s) => s.type === FsEntryType.Directory && !s.error)
		.filter((s) => {
			const filter = filterText();
			if (!filter) return true;
			return s.name.toLowerCase().startsWith(filter.toLowerCase());
		}),
);

async function loadSuggestions(path: string) {
	isLoading = true;
	try {
		const response = await api.fs.read.get({
			query: {
				path,
			},
		});
		if (!response.error && response.data && "entries" in response.data) {
			suggestions = response.data.entries;
		} else {
			suggestions = [];
		}
	} catch {
		suggestions = [];
	}
	isLoading = false;
}

async function validatePath(path: string) {
	if (!path) {
		isValid = false;
		onvalidchange?.(false);
		return;
	}

	try {
		const response = await api.fs.read.get({
			query: {
				path,
			},
		});
		if (!response.error && response.data && "entries" in response.data) {
			isValid = true;
			onvalidchange?.(true);
		} else {
			isValid = false;
			onvalidchange?.(false);
		}
	} catch {
		isValid = false;
		onvalidchange?.(false);
	}
}

function handleInput(event: Event) {
	const target = event.target as HTMLInputElement;
	value = target.value;
	onchange?.(value);
	selectedIndex = -1;
	isValid = null;

	if (validationTimeout) {
		clearTimeout(validationTimeout);
	}

	validationTimeout = setTimeout(() => {
		void validatePath(value);
	}, 500);

	const dir = dirPath();
	void loadSuggestions(dir);

	if (!isOpen && value) {
		isOpen = true;
	}
}

function handleFocus() {
	if (value) {
		const dir = dirPath();
		void loadSuggestions(dir);
		isOpen = true;
	} else {
		void loadSuggestions("/");
		isOpen = true;
	}
}

function handleBlur(event: FocusEvent) {
	const relatedTarget = event.relatedTarget as HTMLElement;
	if (relatedTarget?.closest(".path-input-dropdown")) {
		return;
	}
	setTimeout(() => {
		isOpen = false;
	}, 150);
}

async function selectSuggestion(suggestion: FsEntry) {
	const newPath = suggestion.path.endsWith("/") ? suggestion.path : `${suggestion.path}/`;
	value = newPath;
	onchange?.(newPath);
	selectedIndex = -1;
	void validatePath(newPath);
	await loadSuggestions(newPath);
	isOpen = true;
	inputRef?.focus();
}

function handleKeydown(event: KeyboardEvent) {
	if (!isOpen) {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			isOpen = true;
			const dir = dirPath();
			void loadSuggestions(dir);
			event.preventDefault();
		}
		return;
	}

	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredSuggestions.length - 1);
			break;
		case "ArrowUp":
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
			break;
		case "Enter":
			event.preventDefault();
			if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
				selectSuggestion(filteredSuggestions[selectedIndex]);
			}
			break;
		case "Escape":
			isOpen = false;
			selectedIndex = -1;
			break;
		case "Tab":
			if (filteredSuggestions.length === 1) {
				event.preventDefault();
				selectSuggestion(filteredSuggestions[0]);
			} else if (selectedIndex >= 0) {
				event.preventDefault();
				selectSuggestion(filteredSuggestions[selectedIndex]);
			}
			break;
	}
}

$effect(() => {
	if (value && isValid === null) {
		void validatePath(value);
	}
});
</script>

<div class="relative">
	<div class="relative">
		<Folder class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
		<input
			bind:this={inputRef}
			type="text"
			{value}
			{disabled}
			{placeholder}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			class="w-full rounded border bg-bg-void py-2 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors
				{isValid === true ? 'border-terminal-green focus:border-terminal-green' : ''}
				{isValid === false ? 'border-terminal-red focus:border-terminal-red' : ''}
				{isValid === null ? 'border-border-default focus:border-terminal-green' : ''}"
			autocomplete="off"
			spellcheck="false"
		/>
		<div class="absolute right-3 top-1/2 -translate-y-1/2">
			{#if isLoading}
				<div class="size-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent"></div>
			{:else if isValid === true}
				<Check class="size-4 text-terminal-green" />
			{:else if isValid === false}
				<AlertCircle class="size-4 text-terminal-red" />
			{/if}
		</div>
	</div>

	{#if isOpen && filteredSuggestions.length > 0}
		<div
			class="path-input-dropdown absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded border border-border-default bg-bg-surface shadow-lg"
		>
			{#each filteredSuggestions as suggestion, index (suggestion.path)}
				<button
					type="button"
					class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors
						{index === selectedIndex ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}"
					onmousedown={() => selectSuggestion(suggestion)}
					onmouseenter={() => (selectedIndex = index)}
				>
					<Folder class="size-4 shrink-0 text-terminal-amber" />
					<span class="truncate">{suggestion.name}</span>
				</button>
			{/each}
		</div>
	{:else if isOpen && !isLoading && value && filteredSuggestions.length === 0}
		<div
			class="path-input-dropdown absolute z-50 mt-1 w-full rounded border border-border-default bg-bg-surface p-3 shadow-lg"
		>
			<span class="text-xs text-text-tertiary">No matching directories</span>
		</div>
	{/if}
</div>

{#if isValid === false && value}
	<p class="mt-1 text-[10px] text-terminal-red">Directory does not exist</p>
{/if}
