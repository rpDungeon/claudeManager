import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { TerminalType } from "@claude-manager/common/src/terminal/terminal.types";
import { treaty } from "@elysiajs/eden";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/db.client";
import { dashboardRoutes } from "./dashboard.routes";

const app = new Elysia().use(dashboardRoutes);
const api = treaty(app);

const TEST_PROJECT_ID = "project:test-dashboard-123" as ProjectId;
const TEST_TERMINAL_ID = "terminal:test-dashboard-456" as TerminalId;

describe("dashboard routes", () => {
	beforeAll(async () => {
		await db.insert(projectSchema).values({
			createdAt: new Date(),
			id: TEST_PROJECT_ID,
			name: "Dashboard Test Project",
			path: "/tmp/dashboard-test",
			updatedAt: new Date(),
		});

		await db.insert(terminalSchema).values({
			createdAt: new Date(),
			id: TEST_TERMINAL_ID,
			name: "Dashboard Test Terminal",
			projectId: TEST_PROJECT_ID,
			type: TerminalType.Shell,
		});
	});

	afterAll(async () => {
		await db.delete(terminalSchema).where(eq(terminalSchema.id, TEST_TERMINAL_ID));
		await db.delete(projectSchema).where(eq(projectSchema.id, TEST_PROJECT_ID));
	});

	describe("GET /dashboard", () => {
		it("returns dashboard data structure", async () => {
			const { data, error, status } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.projects).toBeDefined();
			expect(data.recentSessions).toBeDefined();
			expect(data.stats).toBeDefined();
		});

		it("returns stats with correct shape", async () => {
			const { data, error } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(typeof data.stats.totalProjects).toBe("number");
			expect(typeof data.stats.totalTerminals).toBe("number");
			expect(typeof data.stats.totalSessions).toBe("number");
			expect(typeof data.stats.activeSessions).toBe("number");
			expect(typeof data.stats.activePtyCount).toBe("number");
		});

		it("includes test project in projects list", async () => {
			const { data, error } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			const testProject = data.projects.find((p) => p.id === TEST_PROJECT_ID);
			expect(testProject).toBeDefined();
			expect(testProject?.name).toBe("Dashboard Test Project");
			expect(testProject?.terminalCount).toBe(1);
		});

		it("returns project summaries with correct shape", async () => {
			const { data, error } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			const project = data.projects[0];
			expect(project).toBeDefined();
			if (project) {
				expect(project.id).toBeDefined();
				expect(project.name).toBeDefined();
				expect(project.path).toBeDefined();
				expect(typeof project.terminalCount).toBe("number");
				expect(typeof project.sessionCount).toBe("number");
				expect(typeof project.activeSessionCount).toBe("number");
				expect(typeof project.activePtyCount).toBe("number");
			}
		});

		it("returns recent sessions array", async () => {
			const { data, error } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(Array.isArray(data.recentSessions)).toBe(true);
		});

		it("stats totals are consistent with projects data", async () => {
			const { data, error } = await api.dashboard.get();

			expect(error).toBeNull();
			if (error) throw error;

			const calculatedTotalTerminals = data.projects.reduce((sum, p) => sum + p.terminalCount, 0);
			const calculatedTotalSessions = data.projects.reduce((sum, p) => sum + p.sessionCount, 0);

			expect(data.stats.totalProjects).toBe(data.projects.length);
			expect(data.stats.totalTerminals).toBe(calculatedTotalTerminals);
			expect(data.stats.totalSessions).toBe(calculatedTotalSessions);
		});
	});
});
