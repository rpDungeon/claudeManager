import { ClaudeSessionStatus } from "@claude-manager/common/src/claude/session/claudeSession.types";
import type {
	DashboardData,
	DashboardProjectSummary,
	DashboardSessionSummary,
	DashboardStats,
} from "@claude-manager/common/src/dashboard/dashboard.types";
import { Elysia } from "elysia";

import { db } from "../db/db.client";
import { terminalPtyService } from "../terminal/pty/pty.service";

export const dashboardRoutes = new Elysia({
	prefix: "/dashboard",
}).get("/", async (): Promise<DashboardData> => {
	const projects = await db.query.project.findMany({
		orderBy: (table, { desc }) => [
			desc(table.updatedAt),
		],
		with: {
			claudeSessions: true,
			terminals: true,
		},
	});

	const activePtyIds = new Set(terminalPtyService.instanceIds());

	const projectSummaries: DashboardProjectSummary[] = projects.map((project) => {
		const activeSessionCount = project.claudeSessions.filter((s) => s.status === ClaudeSessionStatus.Active).length;

		const activePtyCount = project.terminals.filter((t) => activePtyIds.has(t.id)).length;

		return {
			activePtyCount,
			activeSessionCount,
			id: project.id,
			name: project.name,
			path: project.path,
			sessionCount: project.claudeSessions.length,
			terminalCount: project.terminals.length,
			updatedAt: project.updatedAt,
		};
	});

	const allSessions = await db.query.claudeSession.findMany({
		limit: 10,
		orderBy: (table, { desc }) => [
			desc(table.lastActiveAt),
		],
	});

	const recentSessions: DashboardSessionSummary[] = allSessions.map((session) => ({
		id: session.id,
		lastActiveAt: session.lastActiveAt,
		name: session.name,
		projectId: session.projectId,
		status: session.status,
	}));

	const stats: DashboardStats = {
		activePtyCount: terminalPtyService.instancesCount(),
		activeSessions: projects.reduce(
			(sum, p) => sum + p.claudeSessions.filter((s) => s.status === ClaudeSessionStatus.Active).length,
			0,
		),
		totalProjects: projects.length,
		totalSessions: projects.reduce((sum, p) => sum + p.claudeSessions.length, 0),
		totalTerminals: projects.reduce((sum, p) => sum + p.terminals.length, 0),
	};

	return {
		projects: projectSummaries,
		recentSessions,
		stats,
	};
});
