import { claudeSessionSchema } from "@claude-manager/common/src/claude/session/claudeSession.schema";
import {
	ClaudeSessionStatus,
	claudeSessionCreate,
	claudeSessionIdSchema,
} from "@claude-manager/common/src/claude/session/claudeSession.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../../db/db.client";

export const claudeSessionRoutes = new Elysia({
	prefix: "/claude/sessions",
})
	.get("/", async () => {
		const sessions = await db.query.claudeSession.findMany({
			orderBy: (table, { desc }) => [
				desc(table.lastActiveAt),
			],
			with: {
				project: true,
			},
		});
		return sessions;
	})
	.get(
		"/:id",
		async ({ params, set }) => {
			const session = await db.query.claudeSession.findFirst({
				where: eq(claudeSessionSchema.id, params.id),
				with: {
					project: true,
					terminals: true,
				},
			});

			if (!session) {
				set.status = 404;
				return {
					error: "Claude session not found",
				};
			}

			return session;
		},
		{
			params: z.object({
				id: claudeSessionIdSchema,
			}),
		},
	)
	.post(
		"/",
		async ({ body }) => {
			const [session] = await db.insert(claudeSessionSchema).values(body).returning();
			return session;
		},
		{
			body: claudeSessionCreate,
		},
	)
	.put(
		"/:id",
		async ({ body, params, set }) => {
			const [session] = await db
				.update(claudeSessionSchema)
				.set({
					...body,
					lastActiveAt: new Date(),
				})
				.where(eq(claudeSessionSchema.id, params.id))
				.returning();

			if (!session) {
				set.status = 404;
				return {
					error: "Claude session not found",
				};
			}

			return session;
		},
		{
			body: z.object({
				description: z.string().optional(),
				name: z.string().optional(),
				status: z.nativeEnum(ClaudeSessionStatus).optional(),
			}),
			params: z.object({
				id: claudeSessionIdSchema,
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, set }) => {
			const [deleted] = await db.delete(claudeSessionSchema).where(eq(claudeSessionSchema.id, params.id)).returning();

			if (!deleted) {
				set.status = 404;
				return {
					error: "Claude session not found",
				};
			}

			return {
				success: true,
			};
		},
		{
			params: z.object({
				id: claudeSessionIdSchema,
			}),
		},
	);
