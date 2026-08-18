import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import type { TerminalId } from "@claude-manager/common/src/terminal/terminal.types";
import { TerminalType } from "@claude-manager/common/src/terminal/terminal.types";
import { treaty } from "@elysiajs/eden";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/db.client";
import { terminalPasteImageMaxBytes } from "./paste.service";
import { terminalRoutes } from "./terminal.routes";

const app = new Elysia().use(terminalRoutes);
const api = treaty(app);

const TEST_PROJECT_ID = "project:test-terminal-routes-123" as ProjectId;
const TEST_TERMINAL_IDS: TerminalId[] = [];
const TEST_PASTE_DIRECTORIES: string[] = [];
const TERMINAL_ID_PATTERN = /^terminal:/;
const TERMINAL_DATA_DIR = resolve(Bun.env.TERMINAL_DATA_DIR);

async function terminalCreateForPasteTest(name: string): Promise<TerminalId> {
	const { data, error } = await api.terminals.post({
		name,
		projectId: TEST_PROJECT_ID,
		type: TerminalType.Shell,
	});
	expect(error).toBeNull();
	if (error) throw error;
	TEST_TERMINAL_IDS.push(data.id);
	return data.id;
}

async function terminalPasteImageRequest(terminalId: TerminalId, image: File): Promise<Response> {
	const formData = new FormData();
	formData.append("image", image);
	return app.handle(
		new Request(`http://localhost/terminals/${encodeURIComponent(terminalId)}/paste-image`, {
			body: formData,
			method: "POST",
		}),
	);
}

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
		for (const directory of TEST_PASTE_DIRECTORIES) {
			rmSync(directory, {
				force: true,
				recursive: true,
			});
		}
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

	describe("POST /terminals/:id/paste-image", () => {
		it("saves the uploaded bytes below the terminal data root", async () => {
			const terminalId = await terminalCreateForPasteTest("Paste Image Success");
			const pasteDirectory = resolve(TERMINAL_DATA_DIR, "paste", terminalId.replace(/[^a-zA-Z0-9_-]/g, "_"));
			TEST_PASTE_DIRECTORIES.push(pasteDirectory);
			const imageBytes = Uint8Array.from([
				137,
				80,
				78,
				71,
				13,
				10,
				26,
				10,
			]);

			const response = await terminalPasteImageRequest(
				terminalId,
				new File(
					[
						imageBytes,
					],
					"client-selected-name.png",
					{
						type: "image/png",
					},
				),
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as {
				path: string;
			};
			expect(data.path).toBe(resolve(data.path));
			expect(dirname(data.path)).toBe(pasteDirectory);
			expect(data.path.endsWith(".png")).toBe(true);
			expect(readFileSync(data.path)).toEqual(Buffer.from(imageBytes));
		});

		it("rejects unsupported MIME types without creating a file", async () => {
			const terminalId = await terminalCreateForPasteTest("Paste Image Unsupported");
			const pasteDirectory = resolve(TERMINAL_DATA_DIR, "paste", terminalId.replace(/[^a-zA-Z0-9_-]/g, "_"));
			TEST_PASTE_DIRECTORIES.push(pasteDirectory);

			const response = await terminalPasteImageRequest(
				terminalId,
				new File(
					[
						"not an image",
					],
					"unsupported.bmp",
					{
						type: "image/bmp",
					},
				),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				message: "Unsupported image type",
			});
			expect(existsSync(pasteDirectory)).toBe(false);
		});

		it("rejects images over 10 MiB without creating a file", async () => {
			const terminalId = await terminalCreateForPasteTest("Paste Image Too Large");
			const pasteDirectory = resolve(TERMINAL_DATA_DIR, "paste", terminalId.replace(/[^a-zA-Z0-9_-]/g, "_"));
			TEST_PASTE_DIRECTORIES.push(pasteDirectory);
			const oversizedBytes = new Uint8Array(terminalPasteImageMaxBytes + 1);

			const response = await terminalPasteImageRequest(
				terminalId,
				new File(
					[
						oversizedBytes,
					],
					"oversized.png",
					{
						type: "image/png",
					},
				),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				message: `Image too large (max ${terminalPasteImageMaxBytes} bytes)`,
			});
			expect(existsSync(pasteDirectory)).toBe(false);
		});

		it("returns 404 for a non-existent terminal", async () => {
			const terminalId = "terminal:paste-image-missing-123456789" as TerminalId;
			const pasteDirectory = resolve(TERMINAL_DATA_DIR, "paste", terminalId.replace(/[^a-zA-Z0-9_-]/g, "_"));
			TEST_PASTE_DIRECTORIES.push(pasteDirectory);

			const response = await terminalPasteImageRequest(
				terminalId,
				new File(
					[
						"valid bytes",
					],
					"missing-terminal.png",
					{
						type: "image/png",
					},
				),
			);

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({
				message: "Terminal not found",
			});
			expect(existsSync(pasteDirectory)).toBe(false);
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
			const pasteDirectory = resolve(TERMINAL_DATA_DIR, "paste", createResult.data.id.replace(/[^a-zA-Z0-9_-]/g, "_"));
			TEST_PASTE_DIRECTORIES.push(pasteDirectory);
			const pasteResponse = await terminalPasteImageRequest(
				createResult.data.id,
				new File(
					[
						"image bytes",
					],
					"to-delete.png",
					{
						type: "image/png",
					},
				),
			);
			expect(pasteResponse.status).toBe(200);
			const pasteData = (await pasteResponse.json()) as {
				path: string;
			};
			expect(existsSync(pasteData.path)).toBe(true);

			const { data, error } = await api
				.terminals({
					id: createResult.data.id,
				})
				.delete();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.deleted).toBe(true);
			expect(existsSync(pasteDirectory)).toBe(false);

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
