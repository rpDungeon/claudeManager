import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { treaty } from "@elysiajs/eden";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/db.client";
import { layoutRoutes } from "./layout.routes";

const app = new Elysia().use(layoutRoutes);
const api = treaty(app);

const TEST_LAYOUT_IDS: LayoutId[] = [];
const TEST_PROJECT_ID = "project:test-layout-routes-123" as ProjectId;
const LAYOUT_ID_PATTERN = /^layout:/;

describe("layout routes", () => {
	beforeAll(async () => {
		await db.insert(projectSchema).values({
			createdAt: new Date(),
			id: TEST_PROJECT_ID,
			name: "Test Layout Project",
			path: "/tmp/test-layout-project",
			updatedAt: new Date(),
		});
	});

	afterAll(async () => {
		for (const id of TEST_LAYOUT_IDS) {
			await db.delete(layoutSchema).where(eq(layoutSchema.id, id));
		}
		await db.delete(projectSchema).where(eq(projectSchema.id, TEST_PROJECT_ID));
	});

	describe("POST /layouts", () => {
		it("creates a new layout with default data", async () => {
			const { data, error, status } = await api.layouts.post({
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
				name: "Test Layout",
				projectId: TEST_PROJECT_ID,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(201);
			expect(data.id).toMatch(LAYOUT_ID_PATTERN);
			expect(data.name).toBe("Test Layout");
			expect(data.data).toBeDefined();
			if (data.data) {
				expect(data.data.desktop).toBeDefined();
				expect(data.data.mobile).toBeDefined();
				expect(data.data.items).toBeDefined();
			}

			TEST_LAYOUT_IDS.push(data.id);
		});

		it("creates a layout with custom data", async () => {
			const customData = {
				desktop: {
					containers: {
						"container-1": {
							activeTabId: null,
							childIds: [],
							id: "container-1",
							type: "tabs" as const,
						},
					},
					rootId: "container-1",
				},
				items: {},
				mobile: {
					containers: {},
					rootId: null,
				},
			};

			const { data, error } = await api.layouts.post({
				data: customData,
				name: "Layout With Data",
				projectId: TEST_PROJECT_ID,
			});

			expect(error).toBeNull();
			if (error) throw error;

			if (data.data) {
				expect(data.data.desktop.rootId).toBe("container-1");
			}
			TEST_LAYOUT_IDS.push(data.id);
		});
	});

	describe("GET /layouts", () => {
		it("lists all layouts", async () => {
			const { data, error } = await api.layouts.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThanOrEqual(2);
		});

		it("returns layouts ordered by updatedAt desc", async () => {
			const { data, error } = await api.layouts.get();

			expect(error).toBeNull();
			if (error) throw error;

			for (let i = 1; i < data.length; i++) {
				const prev = new Date(data[i - 1].updatedAt).getTime();
				const curr = new Date(data[i].updatedAt).getTime();
				expect(prev).toBeGreaterThanOrEqual(curr);
			}
		});
	});

	describe("GET /layouts/:id", () => {
		it("returns a layout by id", async () => {
			const layoutId = TEST_LAYOUT_IDS[0];
			expect(layoutId).toBeDefined();
			if (!layoutId) throw new Error("No test layout created");

			const { data, error } = await api
				.layouts({
					id: layoutId,
				})
				.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.id).toBe(layoutId);
			expect(data.name).toBeDefined();
			expect(data.data).toBeDefined();
		});

		it("returns 404 for non-existent layout", async () => {
			const { error, status } = await api
				.layouts({
					id: "layout:nonexistent123456789" as LayoutId,
				})
				.get();

			expect(status).toBe(404);
			expect(error?.value).toHaveProperty("message", "Layout not found");
		});
	});

	describe("PATCH /layouts/:id", () => {
		it("updates a layout name", async () => {
			const layoutId = TEST_LAYOUT_IDS[0];
			expect(layoutId).toBeDefined();
			if (!layoutId) throw new Error("No test layout created");

			const { data, error } = await api
				.layouts({
					id: layoutId,
				})
				.patch({
					name: "Updated Layout Name",
				});

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.name).toBe("Updated Layout Name");
		});

		it("updates layout data", async () => {
			const layoutId = TEST_LAYOUT_IDS[0];
			if (!layoutId) throw new Error("No test layout created");

			const newData = {
				desktop: {
					containers: {
						root: {
							activeTabId: "item-1",
							childIds: [
								"item-1",
							],
							id: "root",
							type: "tabs" as const,
						},
					},
					rootId: "root",
				},
				items: {
					"item-1": {
						id: "item-1",
						label: "Terminal 1",
						terminalId: "terminal:123",
						type: "terminal" as const,
					},
				},
				mobile: {
					containers: {},
					rootId: null,
				},
			};

			const { data, error } = await api
				.layouts({
					id: layoutId,
				})
				.patch({
					data: newData,
				});

			expect(error).toBeNull();
			if (error) throw error;

			if (data.data) {
				expect(data.data.desktop.rootId).toBe("root");
				expect(data.data.items["item-1"]).toBeDefined();
			}
		});

		it("returns 404 for non-existent layout", async () => {
			const { status } = await api
				.layouts({
					id: "layout:nonexistent123456789" as LayoutId,
				})
				.patch({
					name: "New Name",
				});

			expect(status).toBe(404);
		});
	});

	describe("DELETE /layouts/:id", () => {
		it("deletes a layout", async () => {
			const createResult = await api.layouts.post({
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
				name: "To Delete",
				projectId: TEST_PROJECT_ID,
			});

			expect(createResult.error).toBeNull();
			if (createResult.error) throw createResult.error;

			const { data, error } = await api
				.layouts({
					id: createResult.data.id,
				})
				.delete();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.deleted).toBe(true);

			const { status } = await api
				.layouts({
					id: createResult.data.id,
				})
				.get();
			expect(status).toBe(404);
		});

		it("returns 404 for non-existent layout", async () => {
			const { status } = await api
				.layouts({
					id: "layout:nonexistent123456789" as LayoutId,
				})
				.delete();

			expect(status).toBe(404);
		});
	});
});
