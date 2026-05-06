import type { ClaudeSessionExternalId } from "@claude-manager/common/src/claude/session/claudeSession.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { SvelteMap } from "svelte/reactivity";
import { api } from "$lib/api/api.client";

export interface ClaudeSessionHistoryEntry {
	externalSessionId: string;
	model: string | null;
	cost: string | null;
	tokenUsage: string | null;
	branch: string | null;
	lastActiveAt: Date;
}

const sessionsMap = new SvelteMap<TerminalId, ClaudeSessionHistoryEntry[]>();

const knownExternalIds = new Set<string>();
let knownIdsLoaded = false;
const terminalProjectCache = new Map<TerminalId, ProjectId>();

export function claudeSessionHistoryGet(terminalId: TerminalId): ClaudeSessionHistoryEntry[] {
	return sessionsMap.get(terminalId) ?? [];
}

async function knownExternalIdsEnsureLoaded(): Promise<void> {
	if (knownIdsLoaded) return;
	knownIdsLoaded = true;

	try {
		const { data } = await api.claude.sessions.get();
		if (data && Array.isArray(data)) {
			for (const s of data) {
				knownExternalIds.add(s.externalSessionId);
			}
		}
	} catch {
		knownIdsLoaded = false;
	}
}

async function terminalProjectIdGet(terminalId: TerminalId): Promise<ProjectId | null> {
	const cached = terminalProjectCache.get(terminalId);
	if (cached) return cached;

	const { data } = await api
		.terminals({
			id: terminalId,
		})
		.get();
	if (data?.projectId) {
		const projectId = data.projectId as ProjectId;
		terminalProjectCache.set(terminalId, projectId);
		return projectId;
	}
	return null;
}

export async function claudeSessionHistoryPush(
	terminalId: TerminalId,
	externalSessionId: string,
	model: string | null,
	cost: string | null,
	tokenUsage: string | null,
	branch: string | null,
): Promise<void> {
	const sessions = sessionsMap.get(terminalId) ?? [];
	const existing = sessions.find((e) => e.externalSessionId === externalSessionId);
	if (existing) {
		existing.model = model;
		existing.cost = cost;
		existing.tokenUsage = tokenUsage;
		existing.branch = branch;
		existing.lastActiveAt = new Date();
		return;
	}

	sessionsMap.set(terminalId, [
		{
			branch,
			cost,
			externalSessionId,
			lastActiveAt: new Date(),
			model,
			tokenUsage,
		},
		...sessions,
	]);

	await knownExternalIdsEnsureLoaded();

	if (knownExternalIds.has(externalSessionId)) return;
	knownExternalIds.add(externalSessionId);

	try {
		const projectId = await terminalProjectIdGet(terminalId);
		if (!projectId) return;

		await api.claude.sessions.post({
			externalSessionId: externalSessionId as ClaudeSessionExternalId,
			projectId,
		});
	} catch {}
}
