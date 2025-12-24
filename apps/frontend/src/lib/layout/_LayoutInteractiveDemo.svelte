<!-- Review pending by Autumnlight -->
<!--
@component
name: _LayoutInteractiveDemo (internal)
type: smart
styleguide: 1.0.0
description: Interactive demo wrapper for Layout with state management
usage: Used in Storybook to demonstrate drag and drop functionality
-->
<script lang="ts">
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { LayoutContainerTabs } from "@claude-manager/common/src/layout/container/container.tabs";
import type { LayoutContainerSplit } from "@claude-manager/common/src/layout/container/container.split";
import type { Percentage } from "@claude-manager/common/src/types/common.types";
import type { LayoutDropZonePosition } from "./dropzone/dropzone.lib";
import Layout from "./Layout.component.svelte";

const initialData: LayoutData = {
	desktop: {
		containers: {
			"left-tabs": {
				activeTabId: "file-1",
				childIds: [
					"file-1",
					"file-2",
					"file-3",
				],
				id: "left-tabs",
				type: "tabs",
			},
			"right-tabs": {
				activeTabId: "preview-1",
				childIds: [
					"preview-1",
					"preview-2",
				],
				id: "right-tabs",
				type: "tabs",
			},
			root: {
				childIds: [
					"left-tabs",
					"right-tabs",
				],
				direction: "horizontal",
				id: "root",
				sizes: [
					50,
					50,
				] as Percentage[],
				type: "split",
			},
		},
		rootId: "root",
	},
	items: {
		"file-1": {
			content: "# index.ts\n\nMain entry point",
			id: "file-1",
			label: "index.ts",
			type: "markdown",
		},
		"file-2": {
			content: "# utils.ts\n\nUtility functions",
			id: "file-2",
			label: "utils.ts",
			type: "markdown",
		},
		"file-3": {
			content: "# types.ts\n\nType definitions",
			id: "file-3",
			label: "types.ts",
			type: "markdown",
		},
		"preview-1": {
			content: "# Preview\n\nLive preview here",
			id: "preview-1",
			label: "Preview",
			type: "markdown",
		},
		"preview-2": {
			content: "# Console\n\nOutput logs",
			id: "preview-2",
			label: "Console",
			type: "markdown",
		},
	},
	mobile: {
		containers: {},
		rootId: "file-1",
	},
};

let data = $state<LayoutData>(structuredClone(initialData));
let activeItemId = $state<string | null>("file-1");
let eventLog = $state<string[]>([]);

function log(message: string) {
	eventLog = [
		...eventLog.slice(-9),
		message,
	];
}

function handleTabSelect(containerId: string, itemId: string) {
	log(`Tab selected: ${itemId} in ${containerId}`);

	const container = data.desktop.containers[containerId];
	if (container?.type === "tabs") {
		(container as LayoutContainerTabs).activeTabId = itemId;
		data = {
			...data,
		};
	}
}

function handleItemSelect(itemId: string) {
	log(`Item selected: ${itemId}`);
	activeItemId = itemId;
}

function handleItemReorder(containerId: string, fromItemId: string, toItemId: string) {
	log(`Reorder: ${fromItemId} → ${toItemId} in ${containerId}`);

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
		}
	}
}

function handleItemDrop(droppedItemId: string, targetContainerId: string) {
	log(`Drop: ${droppedItemId} → container ${targetContainerId}`);

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
	}
}

function handleSplitResize(containerId: string, sizes: number[]) {
	log(`Resize: ${containerId} → [${sizes.map((s) => s.toFixed(0)).join(", ")}]`);
}

let splitCounter = $state(0);

const tabsCount = $derived(Object.values(data.desktop.containers).filter((c) => c.type === "tabs").length);
const splitsCount = $derived(Object.values(data.desktop.containers).filter((c) => c.type === "split").length);

function handleSplitDrop(droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) {
	log(`Split: ${droppedItemId} → ${position} of ${targetContainerId}`);

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

	const newTabsId = `new-tabs-${++splitCounter}`;
	const newSplitId = `new-split-${splitCounter}`;

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
				log(`Cleanup: removed empty ${id}`);
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
						log(`Cleanup: collapsed split ${parentId}`);
					}
				}

				changed = true;
				break;
			}
		}
	}
}

function resetLayout() {
	data = structuredClone(initialData);
	activeItemId = "file-1";
	splitCounter = 0;
	eventLog = [
		"Layout reset",
	];
}
</script>

<div class="flex h-full flex-col">
	<div class="flex h-8 items-center justify-between border-b border-border-default bg-bg-surface px-3">
		<span class="text-[11px] text-text-secondary">
			Drag tabs to reorder or move between panels
		</span>
		<button
			type="button"
			class="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-secondary hover:bg-border-active hover:text-text-primary"
			onclick={resetLayout}
		>
			Reset Layout
		</button>
	</div>

	<div class="flex flex-1 overflow-hidden">
		<div class="flex-1">
			<Layout
				{data}
				{activeItemId}
				onTabSelect={handleTabSelect}
				onItemSelect={handleItemSelect}
				onItemReorder={handleItemReorder}
				onItemDrop={handleItemDrop}
				onSplitResize={handleSplitResize}
				onSplitDrop={handleSplitDrop}
			/>
		</div>

		<div class="w-64 border-l border-border-default bg-bg-surface">
			<div class="border-b border-border-default px-3 py-2">
				<span class="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
					Event Log
				</span>
			</div>
			<div class="flex flex-col gap-0.5 p-2">
				{#each eventLog as event, i (i)}
					<div class="rounded bg-bg-elevated px-2 py-1 text-[10px] text-text-secondary">
						{event}
					</div>
				{/each}
				{#if eventLog.length === 0}
					<div class="px-2 py-1 text-[10px] text-text-tertiary italic">
						No events yet
					</div>
				{/if}
			</div>

			<div class="border-t border-border-default px-3 py-2 mt-auto">
				<span class="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
					Layout State
				</span>
			</div>
			<div class="p-2 text-[9px] font-mono text-text-tertiary">
				<div class="mb-1">Tabs: {tabsCount} panels</div>
				<div class="mb-1">Splits: {splitsCount}</div>
				<div>Active: {activeItemId ?? "none"}</div>
			</div>
		</div>
	</div>
</div>
