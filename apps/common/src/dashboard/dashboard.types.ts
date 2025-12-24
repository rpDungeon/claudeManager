import type { ClaudeSessionId } from "../claude/session/claudeSession.id";
import type { ClaudeSessionStatus } from "../claude/session/claudeSession.types";
import type { ProjectId } from "../project/project.id";

export type DashboardProjectSummary = {
	id: ProjectId;
	name: string;
	path: string;
	sessionCount: number;
	terminalCount: number;
	activeSessionCount: number;
	activePtyCount: number;
	updatedAt: Date;
};

export type DashboardSessionSummary = {
	id: ClaudeSessionId;
	projectId: ProjectId;
	name: string | null;
	status: ClaudeSessionStatus;
	lastActiveAt: Date;
};

export type DashboardStats = {
	totalProjects: number;
	totalSessions: number;
	totalTerminals: number;
	activeSessions: number;
	activePtyCount: number;
};

export type DashboardData = {
	projects: DashboardProjectSummary[];
	recentSessions: DashboardSessionSummary[];
	stats: DashboardStats;
};
