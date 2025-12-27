import { layoutIdSchema } from "@claude-manager/common/src/layout/layout.id";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import { type LayoutInsert, layoutCreate, layoutPatch } from "@claude-manager/common/src/layout/layout.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";
import { layoutService } from "./layout.service";

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
		async ({ params, status }) => {
			const layout = await db.query.layout.findFirst({
				where: eq(layoutSchema.id, params.id),
			});

			if (!layout) {
				return status(404, {
					message: "Layout not found",
				});
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
		async ({ body, status }) => {
			const parsed = layoutCreate.parse(body);
			const insertData: LayoutInsert = {
				data: parsed.data,
				name: parsed.name,
				projectId: parsed.projectId,
			};
			const [layout] = await db.insert(layoutSchema).values(insertData).returning();
			return status(201, layout);
		},
		{
			body: layoutCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, status }) => {
			const [layout] = await db
				.update(layoutSchema)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(layoutSchema.id, params.id))
				.returning();

			if (!layout) {
				return status(404, {
					message: "Layout not found",
				});
			}

			layoutService.notify(layout);

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
		async ({ params, status }) => {
			const [deleted] = await db.delete(layoutSchema).where(eq(layoutSchema.id, params.id)).returning();

			if (!deleted) {
				return status(404, {
					message: "Layout not found",
				});
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
