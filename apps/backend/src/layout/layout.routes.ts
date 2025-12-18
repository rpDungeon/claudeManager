import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import { layoutCreate, layoutIdSchema, layoutUpdate } from "@claude-manager/common/src/layout/layout.types";
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
					error: "Layout not found",
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
		async ({ body }) => {
			const [layout] = await db
				.insert(layoutSchema)
				.values({
					desktop: body.desktop ?? {
						nodes: {},
						rootId: null,
					},
					mobile: body.mobile ?? {
						nodes: {},
						rootId: null,
					},
					name: body.name,
				})
				.returning();
			return layout;
		},
		{
			body: layoutCreate,
		},
	)
	.put(
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
					error: "Layout not found",
				};
			}

			return layout;
		},
		{
			body: layoutUpdate,
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
					error: "Layout not found",
				};
			}

			return {
				success: true,
			};
		},
		{
			params: z.object({
				id: layoutIdSchema,
			}),
		},
	);
