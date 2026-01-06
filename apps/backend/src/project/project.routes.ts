import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
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
		async ({ params, status }) => {
			const project = await db.query.project.findFirst({
				where: eq(projectSchema.id, params.id),
				with: {
					claudeSessions: true,
					layout: true,
					terminals: true,
				},
			});

			if (!project) {
				return status(404, {
					message: "Project not found",
				});
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
		async ({ body, status }) => {
			if (body.layoutId) {
				const [project] = await db.insert(projectSchema).values(body).returning();
				return status(201, project);
			}

			const result = await db.transaction(async (tx) => {
				const [project] = await tx.insert(projectSchema).values(body).returning();

				const [layout] = await tx
					.insert(layoutSchema)
					.values({
						data: {
							desktop: {
								containers: {},
								rootId: null,
							},
							items: {},
							mobile: {
								containers: {},
								rootId: null,
							},
						},
						name: "Default",
						projectId: project.id,
					})
					.returning();

				const [updatedProject] = await tx
					.update(projectSchema)
					.set({
						layoutId: layout.id,
					})
					.where(eq(projectSchema.id, project.id))
					.returning();

				return {
					...updatedProject,
					layout,
				};
			});

			return status(201, result);
		},
		{
			body: projectCreate,
		},
	)
	.patch(
		"/:id",
		async ({ body, params, status }) => {
			const [project] = await db
				.update(projectSchema)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(projectSchema.id, params.id))
				.returning();

			if (!project) {
				return status(404, {
					message: "Project not found",
				});
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
		async ({ params, status }) => {
			const [deleted] = await db.delete(projectSchema).where(eq(projectSchema.id, params.id)).returning();

			if (!deleted) {
				return status(404, {
					message: "Project not found",
				});
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
