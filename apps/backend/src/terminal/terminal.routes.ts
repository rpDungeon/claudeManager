import { projectIdSchema } from "@claude-manager/common/src/project/project.id";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { terminalCreate, terminalIdSchema, terminalPatch } from "@claude-manager/common/src/terminal/terminal.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";

export const terminalRoutes = new Elysia({
	prefix: "/terminals",
})
	.get(
		"/",
		async ({ query }) => {
			const terminals = await db.query.terminal.findMany({
				orderBy: (table, { desc }) => [
					desc(table.createdAt),
				],
				where: query.projectId ? eq(terminalSchema.projectId, query.projectId) : undefined,
				with: {
					claudeSession: true,
					project: true,
				},
			});
			return terminals;
		},
		{
			query: z.object({
				projectId: projectIdSchema.optional(),
			}),
		},
	)
	.get(
		"/:id",
		async ({ params, status }) => {
			const terminal = await db.query.terminal.findFirst({
				where: eq(terminalSchema.id, params.id),
				with: {
					claudeSession: true,
					project: true,
				},
			});

			if (!terminal) {
				return status(404, {
					message: "Terminal not found",
				});
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
		async ({ body, status }) => {
			const [terminal] = await db.insert(terminalSchema).values(body).returning();
			return status(201, terminal);
		},
		{
			body: terminalCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, status }) => {
			const [terminal] = await db.update(terminalSchema).set(body).where(eq(terminalSchema.id, params.id)).returning();

			if (!terminal) {
				return status(404, {
					message: "Terminal not found",
				});
			}

			return terminal;
		},
		{
			body: terminalPatch,
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, status }) => {
			const [deleted] = await db.delete(terminalSchema).where(eq(terminalSchema.id, params.id)).returning();

			if (!deleted) {
				return status(404, {
					message: "Terminal not found",
				});
			}

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	);
