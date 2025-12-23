import { claudeSessionIdSchema } from "@claude-manager/common/src/claude/session/claudeSession.id";
import { claudeSessionSchema } from "@claude-manager/common/src/claude/session/claudeSession.schema";
import { claudeSessionCreate, claudeSessionPatch } from "@claude-manager/common/src/claude/session/claudeSession.types";
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
					message: "Claude session not found",
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
		async ({ body, set }) => {
			const [session] = await db.insert(claudeSessionSchema).values(body).returning();
			set.status = 201;
			return session;
		},
		{
			body: claudeSessionCreate,
		},
	)
	.patch(
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
					message: "Claude session not found",
				};
			}

			return session;
		},
		{
			body: claudeSessionPatch,
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
					message: "Claude session not found",
				};
			}

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: claudeSessionIdSchema,
			}),
		},
	);
