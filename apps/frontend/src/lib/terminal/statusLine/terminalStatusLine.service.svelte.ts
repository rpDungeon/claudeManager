import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { SvelteMap } from "svelte/reactivity";
import { terminalInstanceGet } from "../terminal.service.svelte";
import { claudeSessionHistoryPush } from "./claudeSessionHistory.service.svelte";
import { type TerminalStatusLineData, terminalStatusLineParse } from "./terminalStatusLine.lib";

const statusLineMap = new SvelteMap<TerminalId, TerminalStatusLineData>();
const lastScanTime = new Map<TerminalId, number>();
const pendingTimers = new Map<TerminalId, ReturnType<typeof setTimeout>>();

const THROTTLE_MS = 5 * 60 * 1000;
const INITIAL_SCAN_DELAY_MS = 5000;

export function terminalStatusLineGet(terminalId: TerminalId): TerminalStatusLineData | null {
	return statusLineMap.get(terminalId) ?? null;
}

function terminalStatusLineScan(terminalId: TerminalId): void {
	const instance = terminalInstanceGet(terminalId);
	if (!instance) return;

	const terminal = instance.terminal;
	const buffer = terminal.buffer.active;
	const rows = terminal.rows;
	const baseY = buffer.baseY;
	const lines: string[] = [];

	const startRow = baseY;
	const endRow = baseY + rows;

	for (let i = startRow; i < endRow; i++) {
		const line = buffer.getLine(i);
		if (line) {
			lines.push(line.translateToString(true));
		}
	}

	const parsed = terminalStatusLineParse(lines);
	lastScanTime.set(terminalId, Date.now());

	if (parsed) {
		statusLineMap.set(terminalId, parsed);
		if (parsed.sessionId) {
			claudeSessionHistoryPush(
				terminalId,
				parsed.sessionId,
				parsed.model,
				parsed.cost,
				parsed.tokenUsage,
				parsed.branch,
			);
		}
	} else {
		statusLineMap.delete(terminalId);
	}
}

export function terminalStatusLineScanThrottled(terminalId: TerminalId): void {
	const last = lastScanTime.get(terminalId) ?? 0;
	const elapsed = Date.now() - last;

	if (elapsed >= THROTTLE_MS) {
		if (pendingTimers.has(terminalId)) return;

		pendingTimers.set(
			terminalId,
			setTimeout(() => {
				pendingTimers.delete(terminalId);
				terminalStatusLineScan(terminalId);
			}, INITIAL_SCAN_DELAY_MS),
		);
	}
}

export function terminalStatusLineOnInput(terminalId: TerminalId, data: string): void {
	if (data.includes("claude")) {
		if (pendingTimers.has(terminalId)) return;

		pendingTimers.set(
			terminalId,
			setTimeout(() => {
				pendingTimers.delete(terminalId);
				terminalStatusLineScan(terminalId);
			}, INITIAL_SCAN_DELAY_MS),
		);
	}
}

export function terminalStatusLineDestroy(terminalId: TerminalId): void {
	const timer = pendingTimers.get(terminalId);
	if (timer) {
		clearTimeout(timer);
		pendingTimers.delete(terminalId);
	}
	lastScanTime.delete(terminalId);
	statusLineMap.delete(terminalId);
}
