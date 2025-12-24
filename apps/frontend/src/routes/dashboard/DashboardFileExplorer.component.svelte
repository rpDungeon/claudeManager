<!--
@component
name: DashboardFileExplorer
type: smart
styleguide: 1.0.0
description: File explorer panel with real-time updates via WebSocket
usage: Place in dashboard sidebar to browse project files
-->
<script lang="ts">
import { onMount } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import {
	FsEntryType,
	FsWatchMessageClientType,
	FsWatchMessageServerType,
	FsWatchEventType,
	type FsEntry,
} from "@claude-manager/common/src/fs/fs.types";
import FileTree from "$lib/fileTree/FileTree.component.svelte";
import { FileTreeItemType, type FileTreeItemData } from "$lib/fileTree/fileTree.lib";
import { api } from "$lib/api/api.client";

interface Props {
	rootPath?: string;
	onFileSelect?: (path: string) => void;
	onFileOpen?: (path: string) => void;
}

let {
	rootPath = "/home/claude/dev/+vm/+ai/claudeManager/apps/experiments/test",
	onFileSelect,
	onFileOpen,
}: Props = $props();

type ItemId = string;
type WsConnection = ReturnType<typeof api.ws.fs.watch.subscribe>;

let items = $state(new SvelteMap<ItemId, FileTreeItemData>());
let parentMap = $state(new SvelteMap<ItemId, ItemId>());
let expandedIds = $state(new SvelteSet<ItemId>());
let selectedId = $state<ItemId | undefined>(undefined);
let isLoading = $state(false);
let error = $state<string | null>(null);
let wsConnection = $state<WsConnection | null>(null);

const rootId = $derived(rootPath);

function fsEntryToTreeItem(entry: FsEntry): FileTreeItemData {
	return {
		id: entry.path,
		name: entry.name,
		type: entry.type === FsEntryType.Directory ? FileTreeItemType.Folder : FileTreeItemType.File,
	};
}

function addEntries(entries: FsEntry[], parentId?: string) {
	for (const entry of entries) {
		items.set(entry.path, fsEntryToTreeItem(entry));
		if (parentId) {
			parentMap.set(entry.path, parentId);
		}
	}
}

onMount(() => {
	const ws = api.ws.fs.watch.subscribe();
	wsConnection = ws;

	ws.on("open", () => {
		ws.send({
			path: rootPath,
			recursive: false,
			type: FsWatchMessageClientType.Watch,
		});
	});

	ws.subscribe((message) => {
		const msg = message.data;

		if (msg.type === FsWatchMessageServerType.Initial) {
			const isRoot = msg.path === rootPath;

			if (isRoot) {
				items.clear();
				parentMap.clear();

				const rootItem: FileTreeItemData = {
					id: rootPath,
					name: rootPath.split("/").pop() || rootPath,
					type: FileTreeItemType.Folder,
				};
				items.set(rootPath, rootItem);
				isLoading = false;
			}

			addEntries(msg.entries, msg.path);
			expandedIds.add(msg.path);

			const folderItem = items.get(msg.path);
			if (folderItem) {
				folderItem.isLoading = false;
				items.set(msg.path, {
					...folderItem,
				});
			}
		} else if (msg.type === FsWatchMessageServerType.Change) {
			if (msg.event === FsWatchEventType.Delete) {
				items.delete(msg.path);
				parentMap.delete(msg.path);
			} else if (msg.entry) {
				const existingParent = parentMap.get(msg.path);
				items.set(msg.path, fsEntryToTreeItem(msg.entry));
				if (existingParent) {
					parentMap.set(msg.path, existingParent);
				}
			}
		} else if (msg.type === FsWatchMessageServerType.Error) {
			error = msg.message;
			isLoading = false;
		}
	});

	ws.on("error", (err) => {
		console.error("[FileExplorer] WebSocket error:", err);
		error = "Connection error";
	});

	ws.on("close", () => {
		wsConnection = null;
	});

	isLoading = true;

	return () => {
		ws.send({
			path: rootPath,
			type: FsWatchMessageClientType.Unwatch,
		});
		ws.close();
		wsConnection = null;
	};
});

async function handleSelect(itemId: ItemId) {
	selectedId = itemId;
	const item = items.get(itemId);
	if (item?.type === FileTreeItemType.File) {
		onFileSelect?.(itemId);
	}
}

function handleToggle(itemId: ItemId) {
	const item = items.get(itemId);
	if (item?.type !== FileTreeItemType.Folder) return;
	if (!wsConnection) return;

	if (expandedIds.has(itemId)) {
		expandedIds.delete(itemId);
		wsConnection.send({
			path: itemId,
			type: FsWatchMessageClientType.Unwatch,
		});
	} else {
		item.isLoading = true;
		items.set(itemId, {
			...item,
		});
		wsConnection.send({
			path: itemId,
			recursive: false,
			type: FsWatchMessageClientType.Watch,
		});
	}
}

function handleDoubleClick(itemId: ItemId) {
	const item = items.get(itemId);
	if (item?.type === FileTreeItemType.File) {
		onFileOpen?.(itemId);
	}
}
</script>

<div class="flex h-full flex-col bg-bg-surface">
	<div class="flex h-5 items-center justify-between border-b border-border-default px-2">
		<span class="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
			Explorer
		</span>
		<span class="size-1.5 rounded-full {wsConnection !== null ? 'bg-terminal-green' : 'bg-terminal-red'}"></span>
	</div>

	<div class="flex-1 overflow-hidden">
		{#if isLoading}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				Loading...
			</div>
		{:else if error}
			<div class="flex h-full items-center justify-center text-terminal-red text-[11px]">
				{error}
			</div>
		{:else if items.size > 0}
			<FileTree
				{items}
				{parentMap}
				{rootId}
				{selectedId}
				{expandedIds}
				onSelect={handleSelect}
				onToggle={handleToggle}
				onDoubleClick={handleDoubleClick}
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				No files
			</div>
		{/if}
	</div>
</div>
