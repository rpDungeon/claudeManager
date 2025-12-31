<!-- Review pending by Autumnlight -->
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
import { fsPathEnsureTrailingSlash, fsPathParent } from "@claude-manager/common/src/fs/fs.utils";
import FileTree from "$lib/fileTree/FileTree.component.svelte";
import { FileTreeItemType, type FileTreeItemData } from "$lib/fileTree/fileTree.lib";
import { api } from "$lib/api/api.client";
import DashboardFileExplorerContextMenu from "./DashboardFileExplorerContextMenu.component.svelte";
import { TargetType } from "./dashboardFileExplorerContextMenu.lib";
import type { ContextMenuPosition } from "$lib/common/contextMenu/contextMenu.lib";

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

let contextMenuTargetPath = $state<string | null>(null);
let contextMenuTargetType = $state<TargetType>(TargetType.File);
let contextMenuPosition = $state<ContextMenuPosition>({
	x: 0,
	y: 0,
});

let voiceInputText = $state("");
let isRecording = $state(false);
let mediaRecorder = $state<MediaRecorder | null>(null);

const normalizedRootPath = $derived(fsPathEnsureTrailingSlash(rootPath));
const rootId = $derived(normalizedRootPath);

function fsEntryToTreeItem(entry: FsEntry): FileTreeItemData {
	const hasError = Boolean(entry.error);

	let type: FileTreeItemType;
	if (hasError) {
		type = FileTreeItemType.Error;
	} else {
		type = entry.type === FsEntryType.Directory ? FileTreeItemType.Folder : FileTreeItemType.File;
	}

	return {
		errorMessage: entry.error?.message,
		id: entry.path,
		name: entry.name,
		type,
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
		console.log("[FileExplorer] Sending watch for:", normalizedRootPath);
		ws.send({
			path: normalizedRootPath,
			recursive: false,
			type: FsWatchMessageClientType.Watch,
		});
	});

	ws.subscribe((message) => {
		const msg = message.data;

		if (msg.type === FsWatchMessageServerType.Initial) {
			const isRoot = msg.path === normalizedRootPath;

			if (isRoot) {
				items.clear();
				parentMap.clear();

				const rootName = normalizedRootPath.slice(0, -1).split("/").pop() || normalizedRootPath;
				const rootItem: FileTreeItemData = {
					id: normalizedRootPath,
					name: rootName,
					type: FileTreeItemType.Folder,
				};
				items.set(normalizedRootPath, rootItem);
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
				items.set(msg.path, fsEntryToTreeItem(msg.entry));
				const parentPath = fsPathParent(msg.path);
				if (parentPath && items.has(parentPath)) {
					parentMap.set(msg.path, parentPath);
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
		console.log("[FileExplorer] Cleanup: sending unwatch for:", normalizedRootPath);
		ws.send({
			path: normalizedRootPath,
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

function handleContextMenu(itemId: ItemId, event: MouseEvent) {
	event.preventDefault();
	const item = items.get(itemId);
	if (!item) return;

	contextMenuTargetPath = itemId;
	if (item.type === FileTreeItemType.Error) {
		contextMenuTargetType = TargetType.Error;
	} else if (item.type === FileTreeItemType.File) {
		contextMenuTargetType = TargetType.File;
	} else {
		contextMenuTargetType = TargetType.Folder;
	}
	contextMenuPosition = {
		x: event.clientX,
		y: event.clientY,
	};
}

function handleContextMenuClose() {
	contextMenuTargetPath = null;
}

function handleOpenToSide() {
	if (!contextMenuTargetPath) return;
	console.log("[FileExplorer] Open to side:", contextMenuTargetPath);
}

function handleCopyPath() {
	if (!contextMenuTargetPath) return;
	navigator.clipboard.writeText(contextMenuTargetPath);
}

function handleCopyRelativePath() {
	if (!contextMenuTargetPath) return;
	const relativePath = contextMenuTargetPath.replace(normalizedRootPath, "");
	navigator.clipboard.writeText(relativePath);
}

async function handleNewFile() {
	if (!contextMenuTargetPath) return;
	const fileName = prompt("Enter file name:");
	if (!fileName) return;

	const parentPath = contextMenuTargetPath.endsWith("/") ? contextMenuTargetPath.slice(0, -1) : contextMenuTargetPath;
	const filePath = `${parentPath}/${fileName}`;
	const result = await api.fs.file.post({
		content: "",
		path: filePath,
	});

	if (result.error) {
		const errorMsg = result.error.value?.message || "Unknown error";
		console.error("[FileExplorer] Failed to create file:", errorMsg);
		alert(`Failed to create file: ${errorMsg}`);
	}
	handleContextMenuClose();
}

async function handleNewFolder() {
	if (!contextMenuTargetPath) return;
	const folderName = prompt("Enter folder name:");
	if (!folderName) return;

	const parentPath = contextMenuTargetPath.endsWith("/") ? contextMenuTargetPath.slice(0, -1) : contextMenuTargetPath;
	const folderPath = `${parentPath}/${folderName}`;
	const result = await api.fs.folder.post({
		path: folderPath,
	});

	if (result.error) {
		const errorMsg = result.error.value?.message || "Unknown error";
		console.error("[FileExplorer] Failed to create folder:", errorMsg);
		alert(`Failed to create folder: ${errorMsg}`);
	}
	handleContextMenuClose();
}

async function handleRename() {
	if (!contextMenuTargetPath) return;
	const item = items.get(contextMenuTargetPath);
	if (!item) return;

	const newName = prompt("Enter new name:", item.name);
	if (!newName || newName === item.name) return;

	const parentPath = fsPathParent(contextMenuTargetPath).slice(0, -1);
	const newPath = `${parentPath}/${newName}`;
	const result = await api.fs.rename.post({
		newPath,
		oldPath: contextMenuTargetPath,
	});

	if (result.error) {
		const errorMsg = result.error.value?.message || "Unknown error";
		console.error("[FileExplorer] Failed to rename:", errorMsg);
		alert(`Failed to rename: ${errorMsg}`);
	}
	handleContextMenuClose();
}

async function handleDelete() {
	if (!contextMenuTargetPath) return;
	const item = items.get(contextMenuTargetPath);
	if (!item) return;

	const confirmed = confirm(`Delete "${item.name}"?`);
	if (!confirmed) return;

	const result = await api.fs.delete.post({
		path: contextMenuTargetPath,
	});

	if (result.error) {
		const errorMsg = result.error.value?.message || "Unknown error";
		console.error("[FileExplorer] Failed to delete:", errorMsg);
		alert(`Failed to delete: ${errorMsg}`);
	}
	handleContextMenuClose();
}

async function voiceInputToggle() {
	if (isRecording) {
		mediaRecorder?.stop();
		isRecording = false;
		return;
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const recorder = new MediaRecorder(stream);
		const chunks: Blob[] = [];

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) {
				chunks.push(e.data);
			}
		};

		recorder.onstop = async () => {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			const audioBlob = new Blob(chunks, {
				type: "audio/webm",
			});
			await voiceInputTranscribe(audioBlob);
		};

		recorder.start();
		mediaRecorder = recorder;
		isRecording = true;
	} catch (err) {
		console.error("[FileExplorer] Microphone access denied:", err);
	}
}

async function voiceInputTranscribe(audioBlob: Blob) {
	const formData = new FormData();
	formData.append("audio", audioBlob, "recording.webm");

	try {
		const response = await fetch("http://localhost:4030/transcription", {
			body: formData,
			method: "POST",
		});
		if (response.ok) {
			const result = await response.json();
			voiceInputText = result.transcription || "";
		}
	} catch (err) {
		console.error("[FileExplorer] Transcription failed:", err);
	}
}

function voiceInputSubmit() {
	if (!voiceInputText.trim()) return;
	console.log("[FileExplorer] Voice input submitted:", voiceInputText);
	voiceInputText = "";
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
				onContextMenu={handleContextMenu}
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				No files
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-1.5 border-t border-border-default p-2">
		<input
			type="text"
			bind:value={voiceInputText}
			onkeydown={(e) => e.key === "Enter" && voiceInputSubmit()}
			placeholder="Voice input..."
			class="flex-1 bg-bg-elevated border border-border-default rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-terminal-green"
		/>
		<button
			onclick={voiceInputToggle}
			class="flex items-center justify-center size-7 rounded border transition-colors {isRecording
				? 'bg-terminal-red/20 border-terminal-red text-terminal-red'
				: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
			title={isRecording ? "Stop recording" : "Start recording"}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
				<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
				<path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11Z" />
			</svg>
		</button>
	</div>
</div>

{#if contextMenuTargetPath}
	<DashboardFileExplorerContextMenu
		targetType={contextMenuTargetType}
		position={contextMenuPosition}
		onOpenToSide={handleOpenToSide}
		onCopyPath={handleCopyPath}
		onCopyRelativePath={handleCopyRelativePath}
		onNewFile={handleNewFile}
		onNewFolder={handleNewFolder}
		onRename={handleRename}
		onDelete={handleDelete}
		onClose={handleContextMenuClose}
	/>
{/if}
