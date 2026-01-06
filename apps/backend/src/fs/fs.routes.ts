import { Elysia } from "elysia";
import { z } from "zod";

import { fsService } from "./fs.service";

export const fsRoutes = new Elysia({
	prefix: "/fs",
})
	.get(
		"/read",
		async ({ query, status }) => {
			const result = await fsService.read(query.path);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return result.data;
		},
		{
			query: z.object({
				path: z.string().min(1),
			}),
		},
	)
	.post(
		"/rename",
		async ({ body, status }) => {
			const result = await fsService.rename(body.oldPath, body.newPath);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return result.data;
		},
		{
			body: z.object({
				newPath: z.string().min(1),
				oldPath: z.string().min(1),
			}),
		},
	)
	.post(
		"/delete",
		async ({ body, status }) => {
			const result = await fsService.delete(body.path);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return {
				success: true,
			};
		},
		{
			body: z.object({
				path: z.string().min(1),
			}),
		},
	)
	.post(
		"/file",
		async ({ body, status }) => {
			const result = await fsService.fileCreate(body.path, body.content);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return result.data;
		},
		{
			body: z.object({
				content: z.string().optional(),
				path: z.string().min(1),
			}),
		},
	)
	.post(
		"/folder",
		async ({ body, status }) => {
			const result = await fsService.folderCreate(body.path);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return result.data;
		},
		{
			body: z.object({
				path: z.string().min(1),
			}),
		},
	)
	.put(
		"/file",
		async ({ body, status }) => {
			const result = await fsService.fileUpdate(body.path, body.content);

			if (!result.ok) {
				return status(result.status, {
					message: result.error,
				});
			}

			return result.data;
		},
		{
			body: z.object({
				content: z.string(),
				path: z.string().min(1),
			}),
		},
	)
	.get(
		"/list-recursive",
		async ({ query }) => {
			return fsService.listRecursive(query.path, {
				maxDepth: query.maxDepth,
			});
		},
		{
			query: z.object({
				maxDepth: z.coerce.number().optional(),
				path: z.string().min(1),
			}),
		},
	);
