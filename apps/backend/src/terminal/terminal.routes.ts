import { projectIdSchema } from "@claude-manager/common/src/project/project.id";
import { terminalInputLogSchema } from "@claude-manager/common/src/terminal/terminal.inputlog.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { terminalCreate, terminalIdSchema, terminalPatch } from "@claude-manager/common/src/terminal/terminal.types";
import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

import { db } from "../db/db.client";
import { terminalPtyService } from "./pty/pty.service";

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
	.get("/active/list", async () => {
		const activeInstances = terminalPtyService.instancesInfo();
		return activeInstances;
	})
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

			terminalPtyService.instanceKill(params.id);

			return {
				deleted: true,
			};
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	)
	.get(
		"/:id/status",
		async ({ params }) => {
			const isRunning = terminalPtyService.instanceIsRunning(params.id);
			const info = terminalPtyService.instanceInfo(params.id);
			return {
				isRunning,
				...info,
			};
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	)
	.get(
		"/:id/input-logs",
		async ({ params, query }) => {
			const logs = await db
				.select()
				.from(terminalInputLogSchema)
				.where(eq(terminalInputLogSchema.terminalId, params.id))
				.orderBy(desc(terminalInputLogSchema.timestamp))
				.limit(query.limit ?? 100);
			return logs;
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
			query: z.object({
				limit: z.coerce.number().optional(),
			}),
		},
	)
	.post(
		"/:id/kill",
		async ({ params }) => {
			const killed = terminalPtyService.instanceKill(params.id);
			return {
				killed,
			};
		},
		{
			params: z.object({
				id: terminalIdSchema,
			}),
		},
	);
