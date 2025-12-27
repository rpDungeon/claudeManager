import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { treaty } from "@elysiajs/eden";
import { Elysia } from "elysia";
import { fsRoutes } from "./fs.routes";

const app = new Elysia().use(fsRoutes);
const api = treaty(app);

const TEST_DIR = join(tmpdir(), `claude-manager-fs-test-${Date.now()}`);
const TEST_FILE = join(TEST_DIR, "test-file.txt");
const TEST_CONTENT = "Hello, World!";
const TEST_CONTENT_BASE64 = Buffer.from(TEST_CONTENT).toString("base64");

describe("fs routes", () => {
	beforeAll(() => {
		mkdirSync(TEST_DIR, {
			recursive: true,
		});
		writeFileSync(TEST_FILE, TEST_CONTENT);
	});

	afterAll(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, {
				force: true,
				recursive: true,
			});
		}
	});

	describe("GET /fs/read", () => {
		it("reads a file successfully", async () => {
			const { data, error, status } = await api.fs.read.get({
				query: {
					path: TEST_FILE,
				},
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.content).toBe(TEST_CONTENT_BASE64);
			expect(data.type).toBe("file");
		});

		it("reads a directory successfully", async () => {
			const { data, error, status } = await api.fs.read.get({
				query: {
					path: TEST_DIR,
				},
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.type).toBe("directory");
			expect(Array.isArray(data.entries)).toBe(true);
		});

		it("returns 404 for non-existent path", async () => {
			const { status } = await api.fs.read.get({
				query: {
					path: join(TEST_DIR, "nonexistent.txt"),
				},
			});

			expect(status).toBe(404);
		});
	});

	describe("POST /fs/file", () => {
		it("creates a new file", async () => {
			const newFilePath = join(TEST_DIR, "new-file.txt");
			const contentBase64 = Buffer.from("New file content").toString("base64");

			const { data, error, status } = await api.fs.file.post({
				content: contentBase64,
				path: newFilePath,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.path).toBe(newFilePath);
			expect(existsSync(newFilePath)).toBe(true);
		});

		it("creates an empty file without content", async () => {
			const emptyFilePath = join(TEST_DIR, "empty-file.txt");

			const { error } = await api.fs.file.post({
				path: emptyFilePath,
			});

			expect(error).toBeNull();
			expect(existsSync(emptyFilePath)).toBe(true);
		});

		it("returns 409 if file already exists", async () => {
			const { status } = await api.fs.file.post({
				content: "Duplicate",
				path: TEST_FILE,
			});

			expect(status).toBe(409);
		});
	});

	describe("POST /fs/folder", () => {
		it("creates a new folder", async () => {
			const newFolderPath = join(TEST_DIR, "new-folder");

			const { data, error, status } = await api.fs.folder.post({
				path: newFolderPath,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.path).toBe(`${newFolderPath}/`);
			expect(existsSync(newFolderPath)).toBe(true);
		});

		it("returns 404 when parent directory does not exist", async () => {
			const nestedPath = join(TEST_DIR, "nonexistent-parent", "folder");

			const { status } = await api.fs.folder.post({
				path: nestedPath,
			});

			expect(status).toBe(404);
		});

		it("returns 409 if folder already exists", async () => {
			const { status } = await api.fs.folder.post({
				path: TEST_DIR,
			});

			expect(status).toBe(409);
		});
	});

	describe("PUT /fs/file", () => {
		it("updates an existing file", async () => {
			const updatePath = join(TEST_DIR, "to-update.txt");
			writeFileSync(updatePath, "original content");

			const updatedContent = "updated content";
			const updatedContentBase64 = Buffer.from(updatedContent).toString("base64");

			const { data, error, status } = await api.fs.file.put({
				content: updatedContentBase64,
				path: updatePath,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.path).toBe(updatePath);

			const readResult = await api.fs.read.get({
				query: {
					path: updatePath,
				},
			});
			expect(readResult.data?.content).toBe(updatedContentBase64);
		});

		it("returns 404 for non-existent file", async () => {
			const { status } = await api.fs.file.put({
				content: "content",
				path: join(TEST_DIR, "nonexistent-update.txt"),
			});

			expect(status).toBe(404);
		});
	});

	describe("POST /fs/rename", () => {
		it("renames a file", async () => {
			const oldPath = join(TEST_DIR, "old-name.txt");
			const newPath = join(TEST_DIR, "new-name.txt");
			writeFileSync(oldPath, "rename test");

			const { data, error, status } = await api.fs.rename.post({
				newPath,
				oldPath,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.path).toBe(newPath);
			expect(existsSync(oldPath)).toBe(false);
			expect(existsSync(newPath)).toBe(true);
		});

		it("returns 404 for non-existent source", async () => {
			const { status } = await api.fs.rename.post({
				newPath: join(TEST_DIR, "new.txt"),
				oldPath: join(TEST_DIR, "nonexistent-source.txt"),
			});

			expect(status).toBe(404);
		});
	});

	describe("POST /fs/delete", () => {
		it("deletes a file", async () => {
			const toDelete = join(TEST_DIR, "to-delete.txt");
			writeFileSync(toDelete, "delete me");

			const { data, error, status } = await api.fs.delete.post({
				path: toDelete,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(existsSync(toDelete)).toBe(false);
		});

		it("deletes a folder", async () => {
			const toDeleteFolder = join(TEST_DIR, "delete-folder");
			mkdirSync(toDeleteFolder);

			const { data, error } = await api.fs.delete.post({
				path: toDeleteFolder,
			});

			expect(error).toBeNull();
			expect(data?.success).toBe(true);
			expect(existsSync(toDeleteFolder)).toBe(false);
		});

		it("returns 404 for non-existent path", async () => {
			const { status } = await api.fs.delete.post({
				path: join(TEST_DIR, "nonexistent-delete.txt"),
			});

			expect(status).toBe(404);
		});
	});
});
