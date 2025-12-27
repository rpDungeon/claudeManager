import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { Layout } from "@claude-manager/common/src/layout/layout.types";

type LayoutCallback = (layout: Layout) => void;

class LayoutService {
	private subscribers = new Map<LayoutId, Set<LayoutCallback>>();

	subscribe(layoutId: LayoutId, callback: LayoutCallback): () => void {
		let callbacks = this.subscribers.get(layoutId);
		if (!callbacks) {
			callbacks = new Set();
			this.subscribers.set(layoutId, callbacks);
		}
		callbacks.add(callback);

		return () => {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.subscribers.delete(layoutId);
			}
		};
	}

	notify(layout: Layout): void {
		const callbacks = this.subscribers.get(layout.id);
		if (!callbacks) return;

		for (const callback of callbacks) {
			callback(layout);
		}
	}

	subscriberCountGet(layoutId: LayoutId): number {
		return this.subscribers.get(layoutId)?.size ?? 0;
	}
}

export const layoutService = new LayoutService();
