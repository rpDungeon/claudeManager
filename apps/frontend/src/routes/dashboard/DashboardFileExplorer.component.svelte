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
import { gitStore } from "$lib/git/gitStore.svelte";
import { breadcrumbsStore } from "$lib/breadcrumbs/breadcrumbs.store.svelte";

interface Props {
	rootPath?: string;
	onFileSelect?: (path: string) => void;
	onFileOpen?: (path: string, openToSide?: boolean) => void;
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
const gitStatusMap = $derived(gitStore.statusMap);

$effect(() => {
	const _statusMap = gitStatusMap;
	for (const [id, item] of items) {
		if (item.type === FileTreeItemType.Folder) continue;
		const newStatus = gitStore.getFileStatus(id);
		if (item.status !== newStatus) {
			items.set(id, {
				...item,
				status: newStatus,
			});
		}
	}
});

$effect(() => {
	for (const targetPath of breadcrumbsStore.expandRequests) {
		if (!targetPath.startsWith(normalizedRootPath)) {
			breadcrumbsStore.clearRequest(targetPath);
			continue;
		}

		const pathsToExpand = breadcrumbPathsToExpand(targetPath, normalizedRootPath);

		for (const folderPath of pathsToExpand) {
			if (!expandedIds.has(folderPath) && wsConnection) {
				const item = items.get(folderPath);
				if (item?.type === FileTreeItemType.Folder) {
					item.isLoading = true;
					items.set(folderPath, {
						...item,
					});
					wsConnection.send({
						path: folderPath,
						recursive: false,
						type: FsWatchMessageClientType.Watch,
					});
				}
			}
		}

		selectedId = targetPath;
		breadcrumbsStore.clearRequest(targetPath);
	}
});

function breadcrumbPathsToExpand(targetPath: string, rootPath: string): string[] {
	const paths: string[] = [];
	let current = targetPath;

	while (current !== rootPath && current.length > rootPath.length) {
		paths.unshift(current);
		const parentPath = fsPathParent(current);
		if (parentPath === current) break;
		current = parentPath;
	}

	return paths;
}

function fsEntryToTreeItem(entry: FsEntry): FileTreeItemData {
	const hasError = Boolean(entry.error);

	let type: FileTreeItemType;
	if (hasError) {
		type = FileTreeItemType.Error;
	} else {
		type = entry.type === FsEntryType.Directory ? FileTreeItemType.Folder : FileTreeItemType.File;
	}

	const gitStatus = gitStore.getFileStatus(entry.path);

	return {
		errorMessage: entry.error?.message,
		id: entry.path,
		name: entry.name,
		status: gitStatus,
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

let currentWatchPath = $state<string | null>(null);

$effect(() => {
	const pathToWatch = normalizedRootPath;

	if (currentWatchPath === pathToWatch) return;

	if (wsConnection && currentWatchPath) {
		console.log("[FileExplorer] Unwatching old path:", currentWatchPath);
		wsConnection.send({
			path: currentWatchPath,
			type: FsWatchMessageClientType.Unwatch,
		});
		gitStore.disconnect();
	}

	items.clear();
	parentMap.clear();
	expandedIds.clear();
	error = null;
	isLoading = true;
	currentWatchPath = pathToWatch;

	const repoPath = pathToWatch.endsWith("/") ? pathToWatch.slice(0, -1) : pathToWatch;
	gitStore.connect(repoPath);

	if (!wsConnection) {
		const ws = api.ws.fs.watch.subscribe();
		wsConnection = ws;

		ws.on("open", () => {
			console.log("[FileExplorer] Sending watch for:", currentWatchPath);
			if (currentWatchPath) {
				ws.send({
					path: currentWatchPath,
					recursive: false,
					type: FsWatchMessageClientType.Watch,
				});
			}
		});

		ws.subscribe((message) => {
			const msg = message.data;

			if (msg.type === FsWatchMessageServerType.Initial) {
				const isRoot = msg.path === currentWatchPath;

				if (isRoot) {
					items.clear();
					parentMap.clear();

					const rootName = msg.path.slice(0, -1).split("/").pop() || msg.path;
					const rootItem: FileTreeItemData = {
						id: msg.path,
						name: rootName,
						type: FileTreeItemType.Folder,
					};
					items.set(msg.path, rootItem);
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
	} else if (wsConnection.ws.readyState === WebSocket.OPEN) {
		console.log("[FileExplorer] Sending watch for new path:", pathToWatch);
		wsConnection.send({
			path: pathToWatch,
			recursive: false,
			type: FsWatchMessageClientType.Watch,
		});
	}

	return () => {
		if (wsConnection && currentWatchPath && wsConnection.ws.readyState === WebSocket.OPEN) {
			console.log("[FileExplorer] Cleanup: sending unwatch for:", currentWatchPath);
			wsConnection.send({
				path: currentWatchPath,
				type: FsWatchMessageClientType.Unwatch,
			});
		}
	};
});

onMount(() => {
	return () => {
		if (wsConnection) {
			wsConnection.close();
			wsConnection = null;
		}
		gitStore.disconnect();
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

function handleDoubleClick(itemId: ItemId, event?: MouseEvent) {
	const item = items.get(itemId);
	if (item?.type === FileTreeItemType.File) {
		onFileOpen?.(itemId, event?.altKey ?? false);
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
	onFileOpen?.(contextMenuTargetPath);
	handleContextMenuClose();
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
	try {
		const { data, error } = await api.transcription.post({
			audio: new File(
				[
					audioBlob,
				],
				"recording.webm",
				{
					type: "audio/webm",
				},
			),
		});

		if (error || !data) {
			console.error("[FileExplorer] Transcription error:", error);
		} else {
			voiceInputText = data.transcription || "";
			navigator.clipboard.writeText(voiceInputText).catch(() => {});
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

function handleReconnect() {
	if (wsConnection) {
		wsConnection.close();
		wsConnection = null;
	}
	gitStore.disconnect();

	items.clear();
	parentMap.clear();
	expandedIds.clear();
	error = null;
	isLoading = true;
	currentWatchPath = null;

	const pathToWatch = normalizedRootPath;
	currentWatchPath = pathToWatch;

	const repoPath = pathToWatch.endsWith("/") ? pathToWatch.slice(0, -1) : pathToWatch;
	gitStore.connect(repoPath);

	const ws = api.ws.fs.watch.subscribe();
	wsConnection = ws;

	ws.on("open", () => {
		console.log("[FileExplorer] Reconnected, sending watch for:", currentWatchPath);
		if (currentWatchPath) {
			ws.send({
				path: currentWatchPath,
				recursive: false,
				type: FsWatchMessageClientType.Watch,
			});
		}
	});

	ws.subscribe((message) => {
		const msg = message.data;

		if (msg.type === FsWatchMessageServerType.Initial) {
			const isRoot = msg.path === currentWatchPath;

			if (isRoot) {
				items.clear();
				parentMap.clear();

				const rootName = msg.path.slice(0, -1).split("/").pop() || msg.path;
				const rootItem: FileTreeItemData = {
					id: msg.path,
					name: rootName,
					type: FileTreeItemType.Folder,
				};
				items.set(msg.path, rootItem);
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
}
</script>

<div class="flex h-full flex-col bg-bg-surface">
	<div class="flex h-5 items-center justify-between border-b border-border-default px-2">
		<span class="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
			Explorer
		</span>
		<button
			type="button"
			onclick={handleReconnect}
			class="flex items-center justify-center p-1 -m-1 rounded transition-colors hover:bg-bg-elevated cursor-pointer"
			title="Click to reconnect"
		>
			<span class="size-1.5 rounded-full {wsConnection !== null ? 'bg-terminal-green' : 'bg-terminal-red'}"></span>
		</button>
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
			class="flex-1 h-6 bg-bg-elevated border border-border-default rounded px-2 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-terminal-green"
		/>
		<button
			onclick={voiceInputToggle}
			class="flex items-center justify-center size-6 rounded border transition-colors {isRecording
				? 'bg-terminal-red/20 border-terminal-red text-terminal-red'
				: 'bg-bg-elevated border-border-default text-text-secondary hover:border-border-active hover:text-text-primary'}"
			title={isRecording ? "Stop recording" : "Start recording"}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-3.5">
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
