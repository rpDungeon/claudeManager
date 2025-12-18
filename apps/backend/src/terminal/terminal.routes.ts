import { projectIdSchema } from "@claude-manager/common/src/project/project.types";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { terminalCreate, terminalIdSchema } from "@claude-manager/common/src/terminal/terminal.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";

export const terminalRoutes = new Elysia({
	prefix: "/terminals",
})
	.get("/", async () => {
		const terminals = await db.query.terminal.findMany({
			orderBy: (table, { desc }) => [
				desc(table.createdAt),
			],
			with: {
				claudeSession: true,
				project: true,
			},
		});
		return terminals;
	})
	.get(
		"/by-project/:projectId",
		async ({ params }) => {
			const terminals = await db.query.terminal.findMany({
				where: eq(terminalSchema.projectId, params.projectId),
				with: {
					claudeSession: true,
				},
			});
			return terminals;
		},
		{
			params: z.object({
				projectId: projectIdSchema,
			}),
		},
	)
	.get(
		"/:id",
		async ({ params, set }) => {
			const terminal = await db.query.terminal.findFirst({
				where: eq(terminalSchema.id, params.id),
				with: {
					claudeSession: true,
					project: true,
				},
			});

			if (!terminal) {
				set.status = 404;
				return {
					error: "Terminal not found",
				};
			}

			return terminal;
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	)
	.post(
		"/",
		async ({ body }) => {
			const [terminal] = await db.insert(terminalSchema).values(body).returning();
			return terminal;
		},
		{
			body: terminalCreate,
		},
	)
	.put(
		"/:id",
		async ({ body, params, set }) => {
			const [terminal] = await db.update(terminalSchema).set(body).where(eq(terminalSchema.id, params.id)).returning();

			if (!terminal) {
				set.status = 404;
				return {
					error: "Terminal not found",
				};
			}

			return terminal;
		},
		{
			body: z.object({
				claudeSessionId: z.string().optional(),
				layoutConfig: z.string().optional(),
				name: z.string().optional(),
			}),
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, set }) => {
			const [deleted] = await db.delete(terminalSchema).where(eq(terminalSchema.id, params.id)).returning();

			if (!deleted) {
				set.status = 404;
				return {
					error: "Terminal not found",
				};
			}

			return {
				success: true,
			};
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	);
