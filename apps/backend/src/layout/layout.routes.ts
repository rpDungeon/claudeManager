import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import { layoutCreate, layoutIdSchema, layoutPatch } from "@claude-manager/common/src/layout/layout.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";

export const layoutRoutes = new Elysia({
	prefix: "/layouts",
})
	.get("/", async () => {
		const layouts = await db.query.layout.findMany({
			orderBy: (table, { desc }) => [
				desc(table.updatedAt),
			],
		});
		return layouts;
	})
	.get(
		"/:id",
		async ({ params, set }) => {
			const layout = await db.query.layout.findFirst({
				where: eq(layoutSchema.id, params.id),
			});

			if (!layout) {
				set.status = 404;
				return {
					message: "Layout not found",
				};
			}

			return layout;
		},
		{
			params: z.object({
				id: layoutIdSchema,
			}),
		},
	)
	.post(
		"/",
		async ({ body, set }) => {
			const [layout] = await db.insert(layoutSchema).values(body).returning();
			set.status = 201;
			return layout;
		},
		{
			body: layoutCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, set }) => {
			const [layout] = await db
				.update(layoutSchema)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(layoutSchema.id, params.id))
				.returning();

			if (!layout) {
				set.status = 404;
				return {
					message: "Layout not found",
				};
			}

			return layout;
		},
		{
			body: layoutPatch,
			params: z.object({
				id: layoutIdSchema,
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, set }) => {
			const [deleted] = await db.delete(layoutSchema).where(eq(layoutSchema.id, params.id)).returning();

			if (!deleted) {
				set.status = 404;
				return {
					message: "Layout not found",
				};
			}

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: layoutIdSchema,
			}),
		},
	);
