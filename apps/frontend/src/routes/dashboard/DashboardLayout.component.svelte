<!-- Review pending by Autumnlight -->
<!--
@component
name: DashboardLayout
type: smart
styleguide: 1.0.0
description: Smart component managing layout state, persistence, and terminal connections
usage: Use as the main dashboard view - handles API calls and state management
-->
<script lang="ts">
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { Layout as LayoutType } from "@claude-manager/common/src/layout/layout.types";
import type { LayoutContainerTabs } from "@claude-manager/common/src/layout/container/container.tabs";
import type { LayoutContainerSplit } from "@claude-manager/common/src/layout/container/container.split";
import type { LayoutItemTerminal } from "@claude-manager/common/src/layout/item/item.terminal";
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import type { Percentage } from "@claude-manager/common/src/types/common.types";
import type { LayoutDropZonePosition } from "$lib/layout/dropzone/dropzone.lib";
import { TerminalType } from "@claude-manager/common/src/terminal/terminal.types";
import Layout from "$lib/layout/Layout.component.svelte";
import { api } from "$lib/api/api.client";
import { PUBLIC_API_URL } from "$env/static/public";

interface Props {
	layoutId?: LayoutId | null;
}

let { layoutId = null }: Props = $props();

let data = $state<LayoutData>(createDefaultLayout());
let activeItemId = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);
let isDirty = $state(false);
let currentProjectId = $state<ProjectId | null>(null);
let terminalCounter = $state(0);

function createDefaultLayout(): LayoutData {
	return {
		desktop: {
			containers: {
				"main-tabs": {
					activeTabId: "welcome",
					childIds: [
						"welcome",
					],
					id: "main-tabs",
					type: "tabs",
				},
			},
			rootId: "main-tabs",
		},
		items: {
			welcome: {
				content: "# Welcome\n\nSelect a terminal or create a new one.",
				id: "welcome",
				label: "Welcome",
				type: "markdown",
			},
		},
		mobile: {
			containers: {},
			rootId: "welcome",
		},
	};
}

async function saveLayout() {
	if (!(layoutId && isDirty)) return;

	const response = await api
		.layouts({
			id: layoutId,
		})
		.patch({
			data,
		});

	if (!response.error) {
		isDirty = false;
	}
}

let sseEffectRunCount = 0;

$effect(() => {
	sseEffectRunCount++;
	console.log("[SSE] Effect running, layoutId:", layoutId, "runCount:", sseEffectRunCount);

	if (sseEffectRunCount > 5) {
		console.error("[SSE] LOOP DETECTED! Effect ran too many times");
		return;
	}

	if (!layoutId) return;

	isLoading = true;
	error = null;

	const token = localStorage.getItem("auth_token");
	const url = `${PUBLIC_API_URL}/layouts/${layoutId}/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
	console.log("[SSE] Connecting to:", url);
	const eventSource = new EventSource(url);

	eventSource.addEventListener("initial", (e: MessageEvent) => {
		console.log("[SSE] Received initial event");
		const layout: LayoutType = JSON.parse(e.data);
		if (layout.data) {
			data = layout.data;
		}
		isLoading = false;
		isDirty = false;
	});

	eventSource.addEventListener("update", (e: MessageEvent) => {
		console.log("[SSE] Received update event");
		const layout: LayoutType = JSON.parse(e.data);
		if (layout.data) {
			data = layout.data;
		}
		isDirty = false;
	});

	eventSource.addEventListener("heartbeat", () => {
		console.log("[SSE] Received heartbeat");
	});

	eventSource.onerror = () => {
		console.log("[SSE] Connection error");
		error = "Connection lost";
		isLoading = false;
	};

	return () => {
		console.log("[SSE] Cleanup, closing EventSource");
		eventSource.close();
	};
});

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function markDirty() {
	isDirty = true;

	if (saveTimeout) clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => {
		saveLayout();
	}, 2000);
}

function handleTabSelect(containerId: string, itemId: string) {
	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		(container as LayoutContainerTabs).activeTabId = itemId;
		data = {
			...data,
		};
		markDirty();
	}
}

function handleItemSelect(itemId: string) {
	activeItemId = itemId;
}

function handleItemReorder(containerId: string, fromItemId: string, toItemId: string) {
	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		const tabsContainer = container as LayoutContainerTabs;
		const fromIndex = tabsContainer.childIds.indexOf(fromItemId);
		const toIndex = tabsContainer.childIds.indexOf(toItemId);

		if (fromIndex !== -1 && toIndex !== -1) {
			const newChildIds = [
				...tabsContainer.childIds,
			];
			newChildIds.splice(fromIndex, 1);
			newChildIds.splice(toIndex, 0, fromItemId);
			tabsContainer.childIds = newChildIds;
			data = {
				...data,
			};
			markDirty();
		}
	}
}

function handleItemDrop(droppedItemId: string, targetContainerId: string) {
	let sourceContainerId: string | null = null;
	for (const [id, container] of Object.entries(data.desktop.containers)) {
		if (container.type === "tabs" && container.childIds.includes(droppedItemId)) {
			sourceContainerId = id;
			break;
		}
	}

	if (!sourceContainerId || sourceContainerId === targetContainerId) return;

	const sourceContainer = data.desktop.containers[sourceContainerId] as LayoutContainerTabs;
	const targetContainer = data.desktop.containers[targetContainerId] as LayoutContainerTabs;

	if (sourceContainer?.type === "tabs" && targetContainer?.type === "tabs") {
		sourceContainer.childIds = sourceContainer.childIds.filter((id) => id !== droppedItemId);
		targetContainer.childIds = [
			...targetContainer.childIds,
			droppedItemId,
		];
		targetContainer.activeTabId = droppedItemId;

		if (sourceContainer.activeTabId === droppedItemId) {
			sourceContainer.activeTabId = sourceContainer.childIds[0] ?? null;
		}

		cleanupEmptyContainers();
		data = {
			...data,
		};
		markDirty();
	}
}

function handleSplitResize(containerId: string, sizes: number[]) {
	const container = data.desktop.containers[containerId];
	if (container?.type === "split") {
		(container as LayoutContainerSplit).sizes = sizes as Percentage[];
		data = {
			...data,
		};
		markDirty();
	}
}

let splitCounter = $state(0);

function handleSplitDrop(droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) {
	let sourceContainerId: string | null = null;
	for (const [id, container] of Object.entries(data.desktop.containers)) {
		if (container.type === "tabs" && container.childIds.includes(droppedItemId)) {
			sourceContainerId = id;
			break;
		}
	}

	if (!sourceContainerId) return;

	const sourceContainer = data.desktop.containers[sourceContainerId] as LayoutContainerTabs;
	sourceContainer.childIds = sourceContainer.childIds.filter((id) => id !== droppedItemId);

	if (sourceContainer.activeTabId === droppedItemId) {
		sourceContainer.activeTabId = sourceContainer.childIds[0] ?? null;
	}

	const newTabsId = `tabs-${++splitCounter}-${Date.now()}`;
	const newSplitId = `split-${splitCounter}-${Date.now()}`;

	const newTabsContainer: LayoutContainerTabs = {
		activeTabId: droppedItemId,
		childIds: [
			droppedItemId,
		],
		id: newTabsId,
		type: "tabs",
	};

	const direction: "horizontal" | "vertical" = position === "left" || position === "right" ? "horizontal" : "vertical";
	const isFirstPosition = position === "left" || position === "top";
	const childIds = isFirstPosition
		? [
				newTabsId,
				targetContainerId,
			]
		: [
				targetContainerId,
				newTabsId,
			];

	const newSplitContainer: LayoutContainerSplit = {
		childIds,
		direction,
		id: newSplitId,
		sizes: [
			50,
			50,
		] as Percentage[],
		type: "split",
	};

	const parentContainerId = findParentContainer(targetContainerId);

	data.desktop.containers[newTabsId] = newTabsContainer;
	data.desktop.containers[newSplitId] = newSplitContainer;

	if (parentContainerId) {
		const parentContainer = data.desktop.containers[parentContainerId];
		if (parentContainer.type === "split") {
			const splitParent = parentContainer as LayoutContainerSplit;
			const idx = splitParent.childIds.indexOf(targetContainerId);
			if (idx !== -1) {
				splitParent.childIds[idx] = newSplitId;
			}
		}
	} else if (data.desktop.rootId === targetContainerId) {
		data.desktop.rootId = newSplitId;
	}

	cleanupEmptyContainers();
	data = {
		...data,
	};
	markDirty();
}

function findParentContainer(childId: string): string | null {
	for (const [id, container] of Object.entries(data.desktop.containers)) {
		if (container.type === "split" && container.childIds.includes(childId)) {
			return id;
		}
	}
	return null;
}

function cleanupEmptyContainers() {
	let changed = true;

	while (changed) {
		changed = false;

		for (const [id, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs" && container.childIds.length === 0) {
				const parentId = findParentContainer(id);
				delete data.desktop.containers[id];

				if (parentId) {
					const parent = data.desktop.containers[parentId] as LayoutContainerSplit;
					parent.childIds = parent.childIds.filter((cid) => cid !== id);

					if (parent.childIds.length === 1) {
						const remainingChildId = parent.childIds[0];
						const grandparentId = findParentContainer(parentId);

						if (grandparentId) {
							const grandparent = data.desktop.containers[grandparentId] as LayoutContainerSplit;
							const idx = grandparent.childIds.indexOf(parentId);
							if (idx !== -1) {
								grandparent.childIds[idx] = remainingChildId;
							}
						} else if (data.desktop.rootId === parentId) {
							data.desktop.rootId = remainingChildId;
						}

						delete data.desktop.containers[parentId];
					}
				}

				changed = true;
				break;
			}
		}
	}
}

async function ensureProject(): Promise<ProjectId | null> {
	if (currentProjectId) return currentProjectId;

	const projectsResponse = await api.projects.get();
	if (!projectsResponse.error && projectsResponse.data && projectsResponse.data.length > 0) {
		currentProjectId = projectsResponse.data[0].id as ProjectId;
		return currentProjectId;
	}

	const createResponse = await api.projects.post({
		name: "Default Project",
		path: "/home/claude",
	});

	if (!createResponse.error && createResponse.data) {
		currentProjectId = createResponse.data.id as ProjectId;
		return currentProjectId;
	}

	return null;
}

async function handleAddItem(containerId: string) {
	console.log("[DashboardLayout] handleAddItem called for container:", containerId);
	const projectId = await ensureProject();
	if (!projectId) {
		console.error("Failed to get or create project");
		return;
	}

	const terminalName = `Shell ${++terminalCounter}`;
	console.log("[DashboardLayout] Creating terminal:", terminalName);

	const response = await api.terminals.post({
		name: terminalName,
		projectId,
		type: TerminalType.Shell,
	});

	if (response.error || !response.data) {
		console.error("Failed to create terminal:", response.error);
		return;
	}

	const terminal = response.data;
	console.log("[DashboardLayout] Terminal created:", terminal.id);

	const terminalItem: LayoutItemTerminal = {
		id: terminal.id,
		label: terminalName,
		terminalId: terminal.id,
		type: "terminal",
	};

	data.items[terminal.id] = terminalItem;

	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		const tabsContainer = container as LayoutContainerTabs;
		tabsContainer.childIds = [
			...tabsContainer.childIds,
			terminal.id,
		];
		tabsContainer.activeTabId = terminal.id;
	}

	console.log("[DashboardLayout] Updating data state");
	data = {
		...data,
	};
	markDirty();
	console.log("[DashboardLayout] handleAddItem complete");
}
</script>

<div class="h-full w-full">
	{#if isLoading}
		<div class="flex h-full items-center justify-center bg-bg-void text-text-tertiary">
			Loading layout...
		</div>
	{:else if error}
		<div class="flex h-full items-center justify-center bg-bg-void text-terminal-red">
			{error}
		</div>
	{:else}
		<Layout
			{data}
			{activeItemId}
			onTabSelect={handleTabSelect}
			onItemSelect={handleItemSelect}
			onItemReorder={handleItemReorder}
			onItemDrop={handleItemDrop}
			onSplitResize={handleSplitResize}
			onSplitDrop={handleSplitDrop}
			onAddItem={handleAddItem}
		/>
	{/if}
</div>
