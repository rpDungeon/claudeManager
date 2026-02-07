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
import type { LayoutItemIframe } from "@claude-manager/common/src/layout/item/item.iframe";
import type { LayoutItemImage } from "@claude-manager/common/src/layout/item/item.image";
import type { LayoutItemMarkdown } from "@claude-manager/common/src/layout/item/item.markdown";
import type { LayoutItemDiff } from "@claude-manager/common/src/layout/item/item.diff";
import type { LayoutItemEditor } from "@claude-manager/common/src/layout/item/item.editor";
import { editorGoToLine } from "$lib/editor/editor.service.svelte";
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import type { Percentage } from "@claude-manager/common/src/types/common.types";
import type { LayoutDropZonePosition } from "$lib/layout/dropzone/dropzone.lib";
import { AddItemType } from "$lib/layout/container/tabs/layoutContainerTabsAddMenu.lib";
import { TerminalType } from "@claude-manager/common/src/terminal/terminal.types";
import Layout from "$lib/layout/Layout.component.svelte";
import { api, backendHost, backendUrl } from "$lib/api/api.client";

type LocalhostUrlResult = {
	converted: boolean;
	label: string;
	url: string;
};

const LOCALHOST_URL_REGEX = /^(https?:\/\/)?localhost:(\d+)(\/.*)?$/;

function localhostUrlConvert(inputUrl: string): LocalhostUrlResult {
	const match = inputUrl.match(LOCALHOST_URL_REGEX);

	if (!match) {
		let label: string;
		try {
			label = new URL(inputUrl).hostname;
		} catch {
			label = "iframe";
		}
		return {
			converted: false,
			label,
			url: inputUrl,
		};
	}

	const port = match[2];
	const path = match[3] || "/";
	const protocol = window.location.protocol;
	const host = backendHost || window.location.host;
	const proxyUrl = `${protocol}//${host}/proxy/${port}${path}`;

	return {
		converted: true,
		label: `localhost:${port}`,
		url: proxyUrl,
	};
}

interface Props {
	layoutId?: LayoutId | null;
	projectId?: ProjectId | null;
	projectPath?: string;
}

let { layoutId = null, projectId = null, projectPath }: Props = $props();

let data = $state<LayoutData>(createDefaultLayout());
let activeItemId = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);
let isReconnecting = $state(false);
let isDirty = $state(false);
let terminalCounter = $state(0);
let isMobile = $state(false);

const MOBILE_TABS_CONTAINER_ID = "mobile-tabs";

const mobileData = $derived.by((): LayoutData => {
	const itemIds = Object.keys(data.items);
	const mobileTabsContainer: LayoutContainerTabs = {
		activeTabId: activeItemId ?? itemIds[0] ?? null,
		childIds: itemIds,
		id: MOBILE_TABS_CONTAINER_ID,
		type: "tabs",
	};

	return {
		desktop: data.desktop,
		items: data.items,
		mobile: {
			containers: {
				[MOBILE_TABS_CONTAINER_ID]: mobileTabsContainer,
			},
			rootId: itemIds.length > 0 ? MOBILE_TABS_CONTAINER_ID : null,
		},
	};
});

export function getActiveItemId(): string | null {
	return activeItemId;
}

export function goToLine(lineNumber: number): void {
	if (!activeItemId) return;
	const item = data.items[activeItemId];
	if (item?.type !== "editor") return;
	editorGoToLine(activeItemId, lineNumber);
}

export function openDiff(filePath: string, repoPath: string, staged: boolean) {
	const itemId = crypto.randomUUID();
	const fileName = filePath.split("/").pop() || "Diff";

	const diffItem: LayoutItemDiff = {
		filePath,
		id: itemId,
		label: `${fileName} (${staged ? "staged" : "unstaged"})`,
		repoPath,
		staged,
		type: "diff",
	};

	data.items[itemId] = diffItem;

	let targetContainerId: string | null = null;

	if (activeItemId) {
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;
				if (tabsContainer.childIds.includes(activeItemId)) {
					targetContainerId = containerId;
					break;
				}
			}
		}
	}

	if (!targetContainerId) {
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				targetContainerId = containerId;
				break;
			}
		}
	}

	if (targetContainerId) {
		const container = data.desktop.containers[targetContainerId];
		if (container?.type === "tabs") {
			const tabsContainer = container as LayoutContainerTabs;
			tabsContainer.childIds = [
				...tabsContainer.childIds,
				itemId,
			];
			tabsContainer.activeTabId = itemId;
		}
	}

	activeItemId = itemId;
	data = {
		...data,
	};
	markDirty();
}

export function openFile(filePath: string, openToSide = false) {
	const itemId = crypto.randomUUID();
	const fileName = filePath.split("/").pop() || "Editor";

	const editorItem: LayoutItemEditor = {
		filePath,
		id: itemId,
		label: fileName,
		type: "editor",
	};

	data.items[itemId] = editorItem;

	let targetContainerId: string | null = null;

	if (activeItemId) {
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;
				if (tabsContainer.childIds.includes(activeItemId)) {
					targetContainerId = containerId;
					break;
				}
			}
		}
	}

	if (!targetContainerId) {
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				targetContainerId = containerId;
				break;
			}
		}
	}

	if (targetContainerId) {
		if (openToSide) {
			const newTabsId = `tabs-${++splitCounter}-${Date.now()}`;
			const newSplitId = `split-${splitCounter}-${Date.now()}`;

			const newTabsContainer: LayoutContainerTabs = {
				activeTabId: itemId,
				childIds: [
					itemId,
				],
				id: newTabsId,
				type: "tabs",
			};

			const newSplitContainer: LayoutContainerSplit = {
				childIds: [
					targetContainerId,
					newTabsId,
				],
				direction: "horizontal",
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
		} else {
			const container = data.desktop.containers[targetContainerId];
			if (container?.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;

				if (activeItemId && tabsContainer.childIds.includes(activeItemId)) {
					const activeItem = data.items[activeItemId];
					if (activeItem?.type === "editor") {
						delete data.items[activeItemId];
						const idx = tabsContainer.childIds.indexOf(activeItemId);
						tabsContainer.childIds[idx] = itemId;
						tabsContainer.activeTabId = itemId;
					} else {
						tabsContainer.childIds = [
							...tabsContainer.childIds,
							itemId,
						];
						tabsContainer.activeTabId = itemId;
					}
				} else {
					tabsContainer.childIds = [
						...tabsContainer.childIds,
						itemId,
					];
					tabsContainer.activeTabId = itemId;
				}
			}
		}
	}

	activeItemId = itemId;
	data = {
		...data,
	};
	markDirty();
}

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

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;

async function saveLayout() {
	if (!layoutId) return;

	if (saveTimeout) {
		clearTimeout(saveTimeout);
	}

	saveTimeout = setTimeout(async () => {
		if (!isDirty || isSaving) return;

		isSaving = true;
		await api
			.layouts({
				id: layoutId,
			})
			.patch({
				data,
			});
		isSaving = false;

		if (isDirty) {
			saveLayout();
		}
	}, 100);
}

let previousLayoutId: LayoutId | null = null;
let currentEventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1000;

function connectSSE(targetLayoutId: LayoutId, _isInitial: boolean) {
	const token = localStorage.getItem("auth_token");
	const url = `${backendUrl}/layouts/${targetLayoutId}/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;

	const eventSource = new EventSource(url);
	currentEventSource = eventSource;

	eventSource.addEventListener("initial", async (e: MessageEvent) => {
		const layout: LayoutType = JSON.parse(e.data);
		const hasValidLayout = layout.data?.desktop?.rootId != null;

		const localActiveTabIds = new Map<string, string>();
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;
				if (tabsContainer.activeTabId) {
					localActiveTabIds.set(containerId, tabsContainer.activeTabId);
				}
			}
		}

		if (hasValidLayout && layout.data) {
			data = layout.data;
		} else {
			const defaultData = createDefaultLayout();
			data = defaultData;
			await api
				.layouts({
					id: targetLayoutId,
				})
				.patch({
					data: defaultData,
				});
		}

		for (const [containerId, localActiveTabId] of localActiveTabIds) {
			const container = data.desktop.containers[containerId];
			if (container?.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;
				if (tabsContainer.childIds.includes(localActiveTabId)) {
					tabsContainer.activeTabId = localActiveTabId;
				}
			}
		}

		const currentItemStillExists = activeItemId && data.items[activeItemId];
		if (!currentItemStillExists) {
			activeItemId = null;
		} else if (activeItemId) {
			for (const container of Object.values(data.desktop.containers)) {
				if (container.type === "tabs") {
					const tabsContainer = container as LayoutContainerTabs;
					if (tabsContainer.childIds.includes(activeItemId)) {
						tabsContainer.activeTabId = activeItemId;
						break;
					}
				}
			}
		}

		isLoading = false;
		isReconnecting = false;
		error = null;
		isDirty = false;
		reconnectAttempts = 0;
	});

	eventSource.addEventListener("update", (e: MessageEvent) => {
		if (isDirty || isSaving) {
			isDirty = false;
			return;
		}

		const localActiveTabIds = new Map<string, string>();
		for (const [containerId, container] of Object.entries(data.desktop.containers)) {
			if (container.type === "tabs") {
				const tabsContainer = container as LayoutContainerTabs;
				if (tabsContainer.activeTabId) {
					localActiveTabIds.set(containerId, tabsContainer.activeTabId);
				}
			}
		}

		const layout: LayoutType = JSON.parse(e.data);
		if (layout.data) {
			data = layout.data;

			for (const [containerId, localActiveTabId] of localActiveTabIds) {
				const container = data.desktop.containers[containerId];
				if (container?.type === "tabs") {
					const tabsContainer = container as LayoutContainerTabs;
					if (tabsContainer.childIds.includes(localActiveTabId)) {
						tabsContainer.activeTabId = localActiveTabId;
					}
				}
			}
		}
	});

	eventSource.addEventListener("heartbeat", () => {});

	eventSource.onerror = () => {
		eventSource.close();
		currentEventSource = null;
		isLoading = false;

		if (targetLayoutId !== layoutId) {
			return;
		}

		isReconnecting = true;
		reconnectAttempts++;
		const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY);

		reconnectTimeout = setTimeout(() => {
			if (targetLayoutId === layoutId) {
				connectSSE(targetLayoutId, false);
			}
		}, delay);
	};

	return eventSource;
}

$effect(() => {
	const mediaQuery = window.matchMedia("(max-width: 767px)");
	isMobile = mediaQuery.matches;

	function handleChange(e: MediaQueryListEvent) {
		isMobile = e.matches;
	}

	mediaQuery.addEventListener("change", handleChange);
	return () => mediaQuery.removeEventListener("change", handleChange);
});

$effect(() => {
	if (layoutId !== previousLayoutId) {
		previousLayoutId = layoutId;
	}

	if (!layoutId) {
		if (currentEventSource) {
			currentEventSource.close();
			currentEventSource = null;
		}
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
		data = createDefaultLayout();
		activeItemId = null;
		isDirty = false;
		isLoading = false;
		return;
	}

	if (currentEventSource) {
		currentEventSource.close();
		currentEventSource = null;
	}
	if (reconnectTimeout) {
		clearTimeout(reconnectTimeout);
		reconnectTimeout = null;
	}

	isLoading = true;
	error = null;
	isReconnecting = false;
	reconnectAttempts = 0;

	connectSSE(layoutId, true);

	return () => {
		if (currentEventSource) {
			currentEventSource.close();
			currentEventSource = null;
		}
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
	};
});

$effect(() => {
	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === "w") {
			event.preventDefault();
			if (!activeItemId) return;

			for (const [containerId, container] of Object.entries(data.desktop.containers)) {
				if (container.type === "tabs") {
					const tabsContainer = container as LayoutContainerTabs;
					if (tabsContainer.childIds.includes(activeItemId)) {
						void handleItemClose(containerId, activeItemId);
						break;
					}
				}
			}
		}
	}

	window.addEventListener("keydown", handleKeyDown);
	return () => window.removeEventListener("keydown", handleKeyDown);
});

function markDirty() {
	if (isMobile) return;
	isDirty = true;
	void saveLayout();
}

function handleTabSelect(containerId: string, itemId: string) {
	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		(container as LayoutContainerTabs).activeTabId = itemId;
		activeItemId = itemId;
		data = {
			...data,
		};
		markDirty();
	}
}

function handleMobileTabSelect(_containerId: string, itemId: string) {
	activeItemId = itemId;
}

function handleItemSelect(itemId: string) {
	activeItemId = itemId;

	for (const container of Object.values(data.desktop.containers)) {
		if (container.type === "tabs") {
			const tabsContainer = container as LayoutContainerTabs;
			if (tabsContainer.childIds.includes(itemId)) {
				tabsContainer.activeTabId = itemId;
				data = {
					...data,
				};
				markDirty();
				break;
			}
		}
	}
}

function handleItemReorder(containerId: string, fromItemId: string, toItemId: string) {
	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		const tabsContainer = container as LayoutContainerTabs;
		const fromIndex = tabsContainer.childIds.indexOf(fromItemId);
		const toIndex = tabsContainer.childIds.indexOf(toItemId);

		if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
			const newChildIds = [
				...tabsContainer.childIds,
			];
			newChildIds.splice(fromIndex, 1);
			const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
			newChildIds.splice(insertIndex, 0, fromItemId);
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
		const splitContainer = container as LayoutContainerSplit;
		const currentSizes = splitContainer.sizes;
		if (currentSizes.length === sizes.length && currentSizes.every((s, i) => Math.abs(s - sizes[i]) < 0.01)) {
			return;
		}
		splitContainer.sizes = sizes as Percentage[];
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

	const parentContainerId = findParentContainer(targetContainerId);
	const parentContainer = parentContainerId ? data.desktop.containers[parentContainerId] : null;

	data.desktop.containers[newTabsId] = newTabsContainer;

	if (parentContainer?.type === "split" && (parentContainer as LayoutContainerSplit).direction === direction) {
		const splitParent = parentContainer as LayoutContainerSplit;
		const targetIdx = splitParent.childIds.indexOf(targetContainerId);

		if (targetIdx !== -1) {
			const insertIdx = isFirstPosition ? targetIdx : targetIdx + 1;
			splitParent.childIds = [
				...splitParent.childIds.slice(0, insertIdx),
				newTabsId,
				...splitParent.childIds.slice(insertIdx),
			];

			const equalSize = Math.floor(100 / splitParent.childIds.length);
			const remainder = 100 - equalSize * splitParent.childIds.length;
			splitParent.sizes = splitParent.childIds.map(
				(_, i) => (i === splitParent.childIds.length - 1 ? equalSize + remainder : equalSize) as Percentage,
			);
		}
	} else {
		const newSplitId = `split-${splitCounter}-${Date.now()}`;
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

		data.desktop.containers[newSplitId] = newSplitContainer;

		if (parentContainerId) {
			const parent = data.desktop.containers[parentContainerId];
			if (parent.type === "split") {
				const splitParent = parent as LayoutContainerSplit;
				const idx = splitParent.childIds.indexOf(targetContainerId);
				if (idx !== -1) {
					splitParent.childIds[idx] = newSplitId;
				}
			}
		} else if (data.desktop.rootId === targetContainerId) {
			data.desktop.rootId = newSplitId;
		}
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
	if (projectId) return projectId;

	const projectsResponse = await api.projects.get();
	if (!projectsResponse.error && projectsResponse.data && projectsResponse.data.length > 0) {
		return projectsResponse.data[0].id as ProjectId;
	}

	const createResponse = await api.projects.post({
		name: "Default Project",
		path: "/home/claude",
	});

	if (!createResponse.error && createResponse.data) {
		return createResponse.data.id as ProjectId;
	}

	return null;
}

async function handleAddItem(containerId: string, itemType: AddItemType) {
	let newItem: LayoutItemTerminal | LayoutItemIframe | LayoutItemImage | LayoutItemMarkdown | LayoutItemEditor;
	let itemId: string;

	switch (itemType) {
		case AddItemType.Terminal: {
			const projectId = await ensureProject();
			if (!projectId) {
				console.error("Failed to get or create project");
				return;
			}

			const terminalName = `Shell ${++terminalCounter}`;

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
			itemId = terminal.id;
			newItem = {
				id: terminal.id,
				label: terminalName,
				type: "terminal",
			};
			break;
		}

		case AddItemType.Iframe: {
			const inputUrl = prompt("Enter URL:", "https://");
			if (!inputUrl) return;

			const { url, label } = localhostUrlConvert(inputUrl);

			itemId = crypto.randomUUID();
			const iframeItem: LayoutItemIframe = {
				id: itemId,
				label,
				type: "iframe",
				url,
			};
			newItem = iframeItem;
			break;
		}

		case AddItemType.Image: {
			const src = prompt("Enter image URL:");
			if (!src) return;

			itemId = crypto.randomUUID();
			const imageItem: LayoutItemImage = {
				id: itemId,
				label: "Image",
				src,
				type: "image",
			};
			newItem = imageItem;
			break;
		}

		case AddItemType.Markdown: {
			itemId = crypto.randomUUID();
			const markdownItem: LayoutItemMarkdown = {
				content: "# New Note\n\nStart typing here...",
				id: itemId,
				label: "Note",
				type: "markdown",
			};
			newItem = markdownItem;
			break;
		}

		case AddItemType.Editor: {
			const filePath = prompt("Enter file path:");
			if (!filePath) return;

			itemId = crypto.randomUUID();
			const editorItem: LayoutItemEditor = {
				filePath,
				id: itemId,
				label: filePath.split("/").pop() || "Editor",
				type: "editor",
			};
			newItem = editorItem;
			break;
		}

		default:
			return;
	}

	data.items[itemId] = newItem;

	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		const tabsContainer = container as LayoutContainerTabs;
		tabsContainer.childIds = [
			...tabsContainer.childIds,
			itemId,
		];
		tabsContainer.activeTabId = itemId;
	}

	data = {
		...data,
	};
	markDirty();
}

function handleItemRename(_containerId: string, itemId: string) {
	const item = data.items[itemId];
	if (!item) return;

	const newLabel = prompt("Enter new name:", item.label);
	if (newLabel && newLabel !== item.label) {
		item.label = newLabel;
		data = {
			...data,
		};
		markDirty();
	}
}

function handleItemChangeUrl(_containerId: string, itemId: string) {
	const item = data.items[itemId];
	if (!item || item.type !== "iframe") return;

	const inputUrl = prompt("Enter new URL:", item.url);
	if (inputUrl && inputUrl !== item.url) {
		const { url, label } = localhostUrlConvert(inputUrl);
		item.url = url;
		item.label = label;
		data = {
			...data,
		};
		markDirty();
	}
}

async function handleItemClose(containerId: string, itemId: string) {
	const item = data.items[itemId];
	const container = data.desktop.containers[containerId];
	if (container?.type !== "tabs") return;

	if (item?.type === "terminal") {
		await api
			.terminals({
				id: itemId,
			})
			.delete();
	}

	const tabsContainer = container as LayoutContainerTabs;
	tabsContainer.childIds = tabsContainer.childIds.filter((id) => id !== itemId);

	if (tabsContainer.activeTabId === itemId) {
		tabsContainer.activeTabId = tabsContainer.childIds[0] ?? null;
	}

	if (activeItemId === itemId) {
		activeItemId = tabsContainer.activeTabId;
	}

	delete data.items[itemId];
	cleanupEmptyContainers();
	data = {
		...data,
	};
	markDirty();
}

async function handleAddItemToEmptyLayout(itemType: AddItemType) {
	let newItem: LayoutItemTerminal | LayoutItemIframe | LayoutItemImage | LayoutItemMarkdown | LayoutItemEditor;
	let itemId: string;

	switch (itemType) {
		case AddItemType.Terminal: {
			const projectId = await ensureProject();
			if (!projectId) {
				console.error("Failed to get or create project");
				return;
			}

			const terminalName = `Shell ${++terminalCounter}`;

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
			itemId = terminal.id;
			newItem = {
				id: terminal.id,
				label: terminalName,
				type: "terminal",
			};
			break;
		}

		case AddItemType.Iframe: {
			const inputUrl = prompt("Enter URL:", "https://");
			if (!inputUrl) return;

			const { url, label } = localhostUrlConvert(inputUrl);

			itemId = crypto.randomUUID();
			const iframeItem: LayoutItemIframe = {
				id: itemId,
				label,
				type: "iframe",
				url,
			};
			newItem = iframeItem;
			break;
		}

		case AddItemType.Image: {
			const src = prompt("Enter image URL:");
			if (!src) return;

			itemId = crypto.randomUUID();
			const imageItem: LayoutItemImage = {
				id: itemId,
				label: "Image",
				src,
				type: "image",
			};
			newItem = imageItem;
			break;
		}

		case AddItemType.Markdown: {
			itemId = crypto.randomUUID();
			const markdownItem: LayoutItemMarkdown = {
				content: "# New Note\n\nStart typing here...",
				id: itemId,
				label: "Note",
				type: "markdown",
			};
			newItem = markdownItem;
			break;
		}

		case AddItemType.Editor: {
			const filePath = prompt("Enter file path:");
			if (!filePath) return;

			itemId = crypto.randomUUID();
			const editorItem: LayoutItemEditor = {
				filePath,
				id: itemId,
				label: filePath.split("/").pop() || "Editor",
				type: "editor",
			};
			newItem = editorItem;
			break;
		}

		default:
			return;
	}

	const newContainerId = `main-tabs-${Date.now()}`;
	const newTabsContainer: LayoutContainerTabs = {
		activeTabId: itemId,
		childIds: [
			itemId,
		],
		id: newContainerId,
		type: "tabs",
	};

	data.items[itemId] = newItem;
	data.desktop.containers[newContainerId] = newTabsContainer;
	data.desktop.rootId = newContainerId;

	data = {
		...data,
	};
	markDirty();
}
</script>

<div class="h-full w-full relative">
	{#if isLoading}
		<div class="flex h-full items-center justify-center bg-bg-void text-text-tertiary">
			Loading layout...
		</div>
	{:else if error}
		<div class="flex h-full items-center justify-center bg-bg-void text-terminal-red">
			{error}
		</div>
	{:else}
		{#if isReconnecting}
			<div class="absolute top-2 right-2 z-50 flex items-center gap-2 rounded bg-bg-elevated px-3 py-1.5 text-xs text-terminal-amber border border-terminal-amber/30">
				<span class="inline-block w-2 h-2 rounded-full bg-terminal-amber animate-pulse"></span>
				Reconnecting...
			</div>
		{/if}
		<Layout
			data={isMobile ? mobileData : data}
			mode={isMobile ? "mobile" : "desktop"}
			{projectPath}
			{activeItemId}
			onTabSelect={isMobile ? handleMobileTabSelect : handleTabSelect}
			onItemSelect={handleItemSelect}
			onItemReorder={isMobile ? undefined : handleItemReorder}
			onItemDrop={isMobile ? undefined : handleItemDrop}
			onSplitResize={isMobile ? undefined : handleSplitResize}
			onSplitDrop={isMobile ? undefined : handleSplitDrop}
			onAddItem={isMobile ? undefined : handleAddItem}
			onItemRename={isMobile ? undefined : handleItemRename}
			onItemChangeUrl={isMobile ? undefined : handleItemChangeUrl}
			onItemClose={isMobile ? undefined : handleItemClose}
			onAddItemToEmptyLayout={isMobile ? undefined : handleAddItemToEmptyLayout}
		/>
	{/if}
</div>
