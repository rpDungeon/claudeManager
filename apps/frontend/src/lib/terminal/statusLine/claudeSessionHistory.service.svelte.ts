import type { ClaudeSessionExternalId } from "@claude-manager/common/src/claude/session/claudeSession.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { api } from "$lib/api/api.client";

export interface ClaudeSessionHistoryEntry {
	externalSessionId: string;
	model: string | null;
	cost: string | null;
	tokenUsage: string | null;
	branch: string | null;
	lastActiveAt: Date;
}

let sessions = $state<ClaudeSessionHistoryEntry[]>([]);
let loaded = false;
let loading = false;

const knownExternalIds = new Set<string>();
const terminalProjectCache = new Map<TerminalId, ProjectId>();

export function claudeSessionHistoryGet(): ClaudeSessionHistoryEntry[] {
	return sessions;
}

export async function claudeSessionHistoryLoad(): Promise<void> {
	if (loading) return;
	loading = true;

	try {
		const { data } = await api.claude.sessions.get();
		if (data && Array.isArray(data)) {
			sessions = data.map((s) => ({
				branch: null,
				cost: null,
				externalSessionId: s.externalSessionId,
				lastActiveAt: new Date(s.lastActiveAt),
				model: null,
				tokenUsage: null,
			}));
			for (const s of sessions) {
				knownExternalIds.add(s.externalSessionId);
			}
		}
		loaded = true;
	} finally {
		loading = false;
	}
}

export function claudeSessionHistoryIsLoaded(): boolean {
	return loaded;
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
	const existing = sessions.find((e) => e.externalSessionId === externalSessionId);
	if (existing) {
		existing.model = model;
		existing.cost = cost;
		existing.tokenUsage = tokenUsage;
		existing.branch = branch;
		existing.lastActiveAt = new Date();
		return;
	}

	sessions = [
		{
			branch,
			cost,
			externalSessionId,
			lastActiveAt: new Date(),
			model,
			tokenUsage,
		},
		...sessions,
	];

	if (knownExternalIds.has(externalSessionId)) return;
	knownExternalIds.add(externalSessionId);

	try {
		const projectId = await terminalProjectIdGet(terminalId);
		if (!projectId) return;

		await api.claude.sessions.post({
			externalSessionId: externalSessionId as ClaudeSessionExternalId,
			projectId,
		});
	} catch {
		// Session already exists or other error — ignore
	}
}
