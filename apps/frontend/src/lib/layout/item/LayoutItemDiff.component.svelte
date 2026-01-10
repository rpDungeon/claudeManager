<!--
@component
name: LayoutItemDiff
type: stupid
styleguide: 1.0.0
description: Renders a git diff view within the layout system
usage: Pass diff item data to render git diff content
-->
<script lang="ts">
import type { LayoutItemDiff } from "@claude-manager/common/src/layout/item/item.diff";
import { onMount } from "svelte";
import { api } from "$lib/api/api.client";
import GitDiffView from "$lib/git/GitDiffView.component.svelte";
import LayoutPane from "../base/LayoutPane.component.svelte";

interface Props {
	item: LayoutItemDiff;
	isActive?: boolean;
	draggable?: boolean;
	isDropTarget?: boolean;
	onclick?: (event: MouseEvent) => void;
	onDragStart?: (itemId: string, event: DragEvent) => void;
	onDragEnd?: (itemId: string, event: DragEvent) => void;
	onDrop?: (droppedItemId: string, targetItemId: string, event: DragEvent) => void;
}

let {
	item,
	isActive = false,
	draggable = true,
	isDropTarget = false,
	onclick,
	onDragStart,
	onDragEnd,
	onDrop,
}: Props = $props();

let diff = $state("");
let isLoading = $state(true);
let error = $state<string | null>(null);

onMount(() => {
	void loadDiff();
});

async function loadDiff() {
	isLoading = true;
	error = null;

	try {
		const { data, error: apiError } = await api.git.diff.get({
			query: {
				file: item.filePath,
				path: item.repoPath,
				staged: item.staged ? "true" : "false",
			},
		});

		if (apiError || !data) {
			error = "Failed to load diff";
			return;
		}

		diff = data.diff;
	} catch (err) {
		error = err instanceof Error ? err.message : "Unknown error";
	} finally {
		isLoading = false;
	}
}

const label = $derived(item.label ?? `${item.filePath} (${item.staged ? "staged" : "unstaged"})`);
</script>

<LayoutPane
	itemId={item.id}
	{label}
	{isActive}
	{draggable}
	{isDropTarget}
	onHeaderClick={onclick}
	{onDragStart}
	{onDragEnd}
	{onDrop}
>
	{#if isLoading}
		<div class="flex h-full items-center justify-center bg-bg-surface text-text-tertiary text-[11px]">
			Loading diff...
		</div>
	{:else if error}
		<div class="flex h-full items-center justify-center bg-bg-surface text-terminal-red text-[11px]">
			{error}
		</div>
	{:else}
		<GitDiffView
			{diff}
			filePath={item.filePath}
			staged={item.staged}
		/>
	{/if}
</LayoutPane>
