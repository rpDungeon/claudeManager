import { projectIdSchema } from "@claude-manager/common/src/project/project.id";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { projectCreate, projectPatch } from "@claude-manager/common/src/project/project.types";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";

export const projectRoutes = new Elysia({
	prefix: "/projects",
})
	.get("/", async () => {
		const projects = await db.query.project.findMany({
			orderBy: (table, { desc }) => [
				desc(table.updatedAt),
			],
			with: {
				layout: true,
			},
		});
		return projects;
	})
	.get(
		"/:id",
		async ({ params, set }) => {
			const project = await db.query.project.findFirst({
				where: eq(projectSchema.id, params.id),
				with: {
					claudeSessions: true,
					layout: true,
					terminals: true,
				},
			});

			if (!project) {
				set.status = 404;
				return {
					message: "Project not found",
				};
			}

			return project;
		},
		{
			params: z.object({
				id: projectIdSchema,
			}),
		},
	)
	.post(
		"/",
		async ({ body, set }) => {
			const [project] = await db.insert(projectSchema).values(body).returning();
			set.status = 201;
			return project;
		},
		{
			body: projectCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, set }) => {
			const [project] = await db
				.update(projectSchema)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(projectSchema.id, params.id))
				.returning();

			if (!project) {
				set.status = 404;
				return {
					message: "Project not found",
				};
			}

			return project;
		},
		{
			body: projectPatch,
			params: z.object({
				id: projectIdSchema,
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, set }) => {
			const [deleted] = await db.delete(projectSchema).where(eq(projectSchema.id, params.id)).returning();

			if (!deleted) {
				set.status = 404;
				return {
					message: "Project not found",
				};
			}

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: projectIdSchema,
			}),
		},
	);
