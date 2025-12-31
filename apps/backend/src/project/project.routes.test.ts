import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { treaty } from "@elysiajs/eden";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/db.client";
import { projectRoutes } from "./project.routes";

const app = new Elysia().use(projectRoutes);
const api = treaty(app);

const TEST_PROJECT_IDS: ProjectId[] = [];
const TEST_LAYOUT_ID = "layout:test-project-routes-123" as LayoutId;
const TEST_LAYOUT_PROJECT_ID = "project:test-project-routes-layout-456" as ProjectId;
const PROJECT_ID_PATTERN = /^project:/;

describe("project routes", () => {
	beforeAll(async () => {
		await db.insert(projectSchema).values({
			createdAt: new Date(),
			id: TEST_LAYOUT_PROJECT_ID,
			name: "Test Layout Owner Project",
			path: "/tmp/test-layout-owner",
			updatedAt: new Date(),
		});

		await db.insert(layoutSchema).values({
			createdAt: new Date(),
			data: {
				desktop: {
					containers: {},
					rootId: null,
				},
				items: {},
				mobile: {
					containers: {},
					rootId: null,
				},
			},
			id: TEST_LAYOUT_ID,
			name: "Test Layout",
			projectId: TEST_LAYOUT_PROJECT_ID,
			updatedAt: new Date(),
		});
	});

	afterAll(async () => {
		for (const id of TEST_PROJECT_IDS) {
			await db.delete(projectSchema).where(eq(projectSchema.id, id));
		}
		await db.delete(layoutSchema).where(eq(layoutSchema.id, TEST_LAYOUT_ID));
		await db.delete(projectSchema).where(eq(projectSchema.id, TEST_LAYOUT_PROJECT_ID));
	});

	describe("POST /projects", () => {
		it("creates a new project", async () => {
			const { data, error, status } = await api.projects.post({
				name: "Test Project",
				path: "/tmp/test-project",
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(201);
			expect(data.id).toMatch(PROJECT_ID_PATTERN);
			expect(data.name).toBe("Test Project");
			expect(data.path).toBe("/tmp/test-project");

			TEST_PROJECT_IDS.push(data.id);
		});

		it("creates a project with layoutId", async () => {
			const { data, error } = await api.projects.post({
				layoutId: TEST_LAYOUT_ID,
				name: "Project With Layout",
				path: "/tmp/project-with-layout",
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.layoutId).toBe(TEST_LAYOUT_ID);
			TEST_PROJECT_IDS.push(data.id);
		});
	});

	describe("GET /projects", () => {
		it("lists all projects", async () => {
			const { data, error } = await api.projects.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThanOrEqual(2);
		});

		it("returns projects with layout relation", async () => {
			const { data, error } = await api.projects.get();

			expect(error).toBeNull();
			if (error) throw error;

			const projectWithLayout = data.find((p) => p.layoutId === TEST_LAYOUT_ID);
			expect(projectWithLayout).toBeDefined();
			expect(projectWithLayout?.layout).toBeDefined();
		});
	});

	describe("GET /projects/:id", () => {
		it("returns a project by id", async () => {
			const projectId = TEST_PROJECT_IDS[0];
			expect(projectId).toBeDefined();
			if (!projectId) throw new Error("No test project created");

			const { data, error } = await api
				.projects({
					id: projectId,
				})
				.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.id).toBe(projectId);
			expect(data.terminals).toBeDefined();
			expect(data.claudeSessions).toBeDefined();
		});

		it("returns 404 for non-existent project", async () => {
			const { error, status } = await api
				.projects({
					id: "project:nonexistent123456789" as ProjectId,
				})
				.get();

			expect(status).toBe(404);
			expect(error?.value).toHaveProperty("message", "Project not found");
		});
	});

	describe("PATCH /projects/:id", () => {
		it("updates a project name", async () => {
			const projectId = TEST_PROJECT_IDS[0];
			expect(projectId).toBeDefined();
			if (!projectId) throw new Error("No test project created");

			const { data, error } = await api
				.projects({
					id: projectId,
				})
				.patch({
					name: "Updated Project Name",
				});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.name).toBe("Updated Project Name");
		});

		it("updates a project path", async () => {
			const projectId = TEST_PROJECT_IDS[0];
			if (!projectId) throw new Error("No test project created");

			const { data, error } = await api
				.projects({
					id: projectId,
				})
				.patch({
					path: "/tmp/updated-path",
				});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.path).toBe("/tmp/updated-path");
		});

		it("returns 404 for non-existent project", async () => {
			const { status } = await api
				.projects({
					id: "project:nonexistent123456789" as ProjectId,
				})
				.patch({
					name: "New Name",
				});

			expect(status).toBe(404);
		});
	});

	describe("DELETE /projects/:id", () => {
		it("deletes a project", async () => {
			const createResult = await api.projects.post({
				name: "To Delete",
				path: "/tmp/to-delete",
			});

			expect(createResult.error).toBeNull();
			if (createResult.error) throw createResult.error;

			const { data, error } = await api
				.projects({
					id: createResult.data.id,
				})
				.delete();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.deleted).toBe(true);

			const { status } = await api
				.projects({
					id: createResult.data.id,
				})
				.get();
			expect(status).toBe(404);
		});

		it("returns 404 for non-existent project", async () => {
			const { status } = await api
				.projects({
					id: "project:nonexistent123456789" as ProjectId,
				})
				.delete();

			expect(status).toBe(404);
		});
	});
});
