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
import { terminalRoutes } from "./terminal.routes";

const app = new Elysia().use(terminalRoutes);
const api = treaty(app);

const TEST_PROJECT_ID = "project:test-terminal-routes-123" as ProjectId;
const TEST_TERMINAL_IDS: TerminalId[] = [];
const TERMINAL_ID_PATTERN = /^terminal:/;

describe("terminal routes", () => {
	beforeAll(async () => {
		await db.insert(projectSchema).values({
			createdAt: new Date(),
			id: TEST_PROJECT_ID,
			name: "Test Project",
			path: "/tmp/test",
			updatedAt: new Date(),
		});
	});

	afterAll(async () => {
		for (const id of TEST_TERMINAL_IDS) {
			await db.delete(terminalSchema).where(eq(terminalSchema.id, id));
		}
		await db.delete(projectSchema).where(eq(projectSchema.id, TEST_PROJECT_ID));
	});

	describe("POST /terminals", () => {
		it("creates a new terminal", async () => {
			const { data, error, status } = await api.terminals.post({
				name: "Test Terminal",
				projectId: TEST_PROJECT_ID,
				type: TerminalType.Shell,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(201);
			expect(data.id).toMatch(TERMINAL_ID_PATTERN);
			expect(data.name).toBe("Test Terminal");
			expect(data.type).toBe(TerminalType.Shell);
			expect(data.projectId).toBe(TEST_PROJECT_ID);

			TEST_TERMINAL_IDS.push(data.id);
		});

		it("creates a claude terminal", async () => {
			const { data, error } = await api.terminals.post({
				name: "Claude Terminal",
				projectId: TEST_PROJECT_ID,
				type: TerminalType.Claude,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.type).toBe(TerminalType.Claude);
			TEST_TERMINAL_IDS.push(data.id);
		});
	});

	describe("GET /terminals", () => {
		it("lists all terminals", async () => {
			const { data, error } = await api.terminals.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThanOrEqual(2);
		});

		it("filters terminals by projectId", async () => {
			const { data, error } = await api.terminals.get({
				query: {
					projectId: TEST_PROJECT_ID,
				},
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(Array.isArray(data)).toBe(true);
			for (const terminal of data) {
				expect(terminal.projectId).toBe(TEST_PROJECT_ID);
			}
		});
	});

	describe("GET /terminals/:id", () => {
		it("returns a terminal by id", async () => {
			const terminalId = TEST_TERMINAL_IDS[0];
			expect(terminalId).toBeDefined();
			if (!terminalId) throw new Error("No test terminal created");

			const { data, error } = await api
				.terminals({
					id: terminalId,
				})
				.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.id).toBe(terminalId);
			expect(data.project).toBeDefined();
		});

		it("returns 404 for non-existent terminal", async () => {
			const { error, status } = await api
				.terminals({
					id: "terminal:nonexistent123456789" as TerminalId,
				})
				.get();

			expect(status).toBe(404);
			expect(error?.value).toHaveProperty("message", "Terminal not found");
		});
	});

	describe("PATCH /terminals/:id", () => {
		it("updates a terminal name", async () => {
			const terminalId = TEST_TERMINAL_IDS[0];
			expect(terminalId).toBeDefined();
			if (!terminalId) throw new Error("No test terminal created");

			const { data, error } = await api
				.terminals({
					id: terminalId,
				})
				.patch({
					name: "Updated Terminal Name",
				});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.name).toBe("Updated Terminal Name");
		});

		it("returns 404 for non-existent terminal", async () => {
			const { status } = await api
				.terminals({
					id: "terminal:nonexistent123456789" as TerminalId,
				})
				.patch({
					name: "New Name",
				});

			expect(status).toBe(404);
		});
	});

	describe("DELETE /terminals/:id", () => {
		it("deletes a terminal", async () => {
			const createResult = await api.terminals.post({
				name: "To Delete",
				projectId: TEST_PROJECT_ID,
				type: TerminalType.Shell,
			});

			expect(createResult.error).toBeNull();
			if (createResult.error) throw createResult.error;

			const { data, error } = await api
				.terminals({
					id: createResult.data.id,
				})
				.delete();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.deleted).toBe(true);

			const { status } = await api
				.terminals({
					id: createResult.data.id,
				})
				.get();
			expect(status).toBe(404);
		});

		it("returns 404 for non-existent terminal", async () => {
			const { status } = await api
				.terminals({
					id: "terminal:nonexistent123456789" as TerminalId,
				})
				.delete();

			expect(status).toBe(404);
		});
	});
});
