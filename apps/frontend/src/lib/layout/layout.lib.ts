// Review pending by Autumnlight
import type { LayoutContainer } from "@claude-manager/common/src/layout/container/container.types";
import type { LayoutItem } from "@claude-manager/common/src/layout/item/item.types";
import type { LayoutArrangement, LayoutData } from "@claude-manager/common/src/layout/layout.types";

export interface LayoutContext {
	arrangement: LayoutArrangement;
	items: Record<string, LayoutItem>;
	activeItemId: string | null;
	onItemSelect?: (itemId: string) => void;
	onTabSelect?: (containerId: string, itemId: string) => void;
	onSplitResize?: (containerId: string, sizes: number[]) => void;
}

export function layoutContextCreate(data: LayoutData, mode: "desktop" | "mobile" = "desktop"): LayoutContext {
	return {
		activeItemId: null,
		arrangement: mode === "desktop" ? data.desktop : data.mobile,
		items: data.items,
	};
}

export function layoutContainerGet(context: LayoutContext, containerId: string): LayoutContainer | undefined {
	return context.arrangement.containers[containerId];
}

export function layoutItemGet(context: LayoutContext, itemId: string): LayoutItem | undefined {
	return context.items[itemId];
}

export function layoutChildResolve(
	context: LayoutContext,
	childId: string,
):
	| {
			type: "container";
			data: LayoutContainer;
	  }
	| {
			type: "item";
			data: LayoutItem;
	  }
	| undefined {
	const container = context.arrangement.containers[childId];
	if (container) {
		return {
			data: container,
			type: "container",
		};
	}
	const item = context.items[childId];
	if (item) {
		return {
			data: item,
			type: "item",
		};
	}
	return undefined;
}
