import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import type { TerminalInputLogEntry } from "@claude-manager/common/src/terminal/terminalInputLog.ws.types";

type InputLogCallback = (log: TerminalInputLogEntry) => void;

class TerminalInputLogService {
	private subscribers = new Map<TerminalId, Set<InputLogCallback>>();

	subscribe(terminalId: TerminalId, callback: InputLogCallback): () => void {
		let callbacks = this.subscribers.get(terminalId);
		if (!callbacks) {
			callbacks = new Set();
			this.subscribers.set(terminalId, callbacks);
		}
		callbacks.add(callback);

		return () => {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.subscribers.delete(terminalId);
			}
		};
	}

	publish(log: TerminalInputLogEntry): void {
		const callbacks = this.subscribers.get(log.terminalId);
		if (!callbacks) return;

		for (const callback of callbacks) {
			callback(log);
		}
	}

	subscriberCountGet(terminalId: TerminalId): number {
		return this.subscribers.get(terminalId)?.size ?? 0;
	}
}

export const terminalInputlogService = new TerminalInputLogService();
