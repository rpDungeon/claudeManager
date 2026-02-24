import { terminalShortcutIdSchema } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.id";
import { terminalShortcutSchema } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.schema";
import {
	terminalShortcutCreate,
	terminalShortcutPatch,
	terminalShortcutReorder,
} from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.types";
import { asc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";

export const terminalShortcutRoutes = new Elysia({
	prefix: "/terminal-shortcuts",
})
	.get("/", async () => {
		const shortcuts = await db
			.select()
			.from(terminalShortcutSchema)
			.orderBy(asc(terminalShortcutSchema.sortOrder), asc(terminalShortcutSchema.createdAt));
		return shortcuts;
	})
	.post(
		"/",
		async ({ body, status }) => {
			const [shortcut] = await db.insert(terminalShortcutSchema).values(body).returning();
			return status(201, shortcut);
		},
		{
			body: terminalShortcutCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, status }) => {
			const [shortcut] = await db
				.update(terminalShortcutSchema)
				.set(body)
				.where(eq(terminalShortcutSchema.id, params.id))
				.returning();

			if (!shortcut) {
				return status(404, {
					message: "Shortcut not found",
				});
			}

			return shortcut;
		},
		{
			body: terminalShortcutPatch,
			params: z.object({
				id: terminalShortcutIdSchema,
			}),
		},
	)
	.put(
		"/reorder",
		async ({ body }) => {
			await db.transaction(async (tx) => {
				for (const item of body) {
					await tx
						.update(terminalShortcutSchema)
						.set({
							sortOrder: item.sortOrder,
						})
						.where(eq(terminalShortcutSchema.id, item.id));
				}
			});
			const shortcuts = await db
				.select()
				.from(terminalShortcutSchema)
				.orderBy(asc(terminalShortcutSchema.sortOrder), asc(terminalShortcutSchema.createdAt));
			return shortcuts;
		},
		{
			body: terminalShortcutReorder,
		},
	)
	.delete(
		"/:id",
		async ({ params, status }) => {
			const [deleted] = await db
				.delete(terminalShortcutSchema)
				.where(eq(terminalShortcutSchema.id, params.id))
				.returning();

			if (!deleted) {
				return status(404, {
					message: "Shortcut not found",
				});
			}

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: terminalShortcutIdSchema,
			}),
		},
	);
