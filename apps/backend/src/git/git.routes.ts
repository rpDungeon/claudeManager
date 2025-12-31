import {
	gitCommitRequestSchema,
	gitDiffResponseSchema,
	gitStageRequestSchema,
	gitStatusSchema,
} from "@claude-manager/common/src/git/git.types";
import { Elysia, t } from "elysia";

import { gitService } from "./git.service";

export const gitRoutes = new Elysia({
	prefix: "/git",
})
	.get(
		"/status",
		async ({ query, set }) => {
			try {
				const status = await gitService.statusGet(query.path);
				return status;
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to get git status",
				};
			}
		},
		{
			query: t.Object({
				path: t.String(),
			}),
			response: {
				200: gitStatusSchema,
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/stage",
		async ({ body, set }) => {
			try {
				await gitService.filesStage(body.path, body.files);
				return {
					ok: true,
				};
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to stage files",
				};
			}
		},
		{
			body: gitStageRequestSchema,
			response: {
				200: t.Object({
					ok: t.Boolean(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/unstage",
		async ({ body, set }) => {
			try {
				await gitService.filesUnstage(body.path, body.files);
				return {
					ok: true,
				};
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to unstage files",
				};
			}
		},
		{
			body: gitStageRequestSchema,
			response: {
				200: t.Object({
					ok: t.Boolean(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/stage-all",
		async ({ body, set }) => {
			try {
				await gitService.filesStageAll(body.path);
				return {
					ok: true,
				};
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to stage all files",
				};
			}
		},
		{
			body: t.Object({
				path: t.String(),
			}),
			response: {
				200: t.Object({
					ok: t.Boolean(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/unstage-all",
		async ({ body, set }) => {
			try {
				await gitService.filesUnstageAll(body.path);
				return {
					ok: true,
				};
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to unstage all files",
				};
			}
		},
		{
			body: t.Object({
				path: t.String(),
			}),
			response: {
				200: t.Object({
					ok: t.Boolean(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/commit",
		async ({ body, set }) => {
			try {
				await gitService.commit(body.path, body.message);
				return {
					ok: true,
				};
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to commit",
				};
			}
		},
		{
			body: gitCommitRequestSchema,
			response: {
				200: t.Object({
					ok: t.Boolean(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.get(
		"/diff",
		async ({ query, set }) => {
			try {
				const diff = await gitService.diffGet(query.path, query.file, query.staged === "true");
				return diff;
			} catch (err) {
				set.status = 500;
				return {
					error: err instanceof Error ? err.message : "Failed to get diff",
				};
			}
		},
		{
			query: t.Object({
				file: t.String(),
				path: t.String(),
				staged: t.Optional(t.String()),
			}),
			response: {
				200: gitDiffResponseSchema,
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	);
