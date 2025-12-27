<!-- Review pending by Autumnlight -->
<!--
@component
name: _LayoutItem (internal)
type: stupid
styleguide: 1.0.0
description: Internal dispatcher that renders the correct item component based on type
usage: Pass a LayoutItem and it will render the appropriate specialized component
-->
<script lang="ts">
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import LayoutItemTerminal from "./LayoutItemTerminal.component.svelte";
import LayoutItemIframe from "./LayoutItemIframe.component.svelte";
import LayoutItemImage from "./LayoutItemImage.component.svelte";
import LayoutItemMarkdown from "./LayoutItemMarkdown.component.svelte";
import LayoutItemPlaceholder from "./LayoutItemPlaceholder.component.svelte";

interface Props {
	item: LayoutItem;
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
</script>

{#if item.type === "terminal"}
	<LayoutItemTerminal {item} {isActive} {draggable} {isDropTarget} {onclick} {onDragStart} {onDragEnd} {onDrop} />
{:else if item.type === "iframe"}
	<LayoutItemIframe {item} {isActive} {draggable} {isDropTarget} {onclick} {onDragStart} {onDragEnd} {onDrop} />
{:else if item.type === "image"}
	<LayoutItemImage {item} {isActive} {draggable} {isDropTarget} {onclick} {onDragStart} {onDragEnd} {onDrop} />
{:else if item.type === "markdown"}
	<LayoutItemMarkdown {item} {isActive} {draggable} {isDropTarget} {onclick} {onDragStart} {onDragEnd} {onDrop} />
{:else}
	<LayoutItemPlaceholder {item} {isActive} {draggable} {isDropTarget} {onclick} {onDragStart} {onDragEnd} {onDrop} />
{/if}
