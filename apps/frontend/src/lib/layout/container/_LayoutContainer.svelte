<!-- Review pending by Autumnlight -->
<!--
@component
name: _LayoutContainer (internal)
type: stupid
styleguide: 1.0.0
description: Internal dispatcher that renders the correct container component based on type
usage: Pass a LayoutContainer and it will render the appropriate specialized component
-->
<script lang="ts">
import type { LayoutContainer } from "@claude-manager/common/src/layout/container/container.types";
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import type { LayoutDropZonePosition } from "../dropzone/dropzone.lib";
import LayoutContainerTabs from "./tabs/LayoutContainerTabs.component.svelte";
import LayoutContainerSplit from "./LayoutContainerSplit.component.svelte";

interface Props {
	container: LayoutContainer;
	containers: Record<string, LayoutContainer>;
	items: Record<string, LayoutItem>;
	activeItemId?: string | null;
	onSplitResize?: (containerId: string, sizes: number[]) => void;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onItemSelect?: (itemId: string) => void;
	onItemReorder?: (containerId: string, fromItemId: string, toItemId: string) => void;
	onItemDrop?: (droppedItemId: string, targetContainerId: string) => void;
	onSplitDrop?: (droppedItemId: string, targetContainerId: string, position: LayoutDropZonePosition) => void;
	onAddItem?: (containerId: string) => void;
	onItemRename?: (containerId: string, itemId: string) => void;
	onItemClose?: (containerId: string, itemId: string) => void;
}

let {
	container,
	containers,
	items,
	activeItemId = null,
	onSplitResize,
	onTabSelect,
	onItemSelect,
	onItemReorder,
	onItemDrop,
	onSplitDrop,
	onAddItem,
	onItemRename,
	onItemClose,
}: Props = $props();
</script>

{#if container.type === "tabs"}
	<LayoutContainerTabs
		{container}
		{items}
		{activeItemId}
		{onTabSelect}
		{onItemSelect}
		{onItemReorder}
		{onItemDrop}
		{onSplitDrop}
		{onAddItem}
		{onItemRename}
		{onItemClose}
	/>
{:else if container.type === "split"}
	<LayoutContainerSplit
		{container}
		{containers}
		{items}
		{activeItemId}
		{onSplitResize}
		{onTabSelect}
		{onItemSelect}
		{onItemReorder}
		{onItemDrop}
		{onSplitDrop}
		{onAddItem}
		{onItemRename}
		{onItemClose}
	/>
{/if}
