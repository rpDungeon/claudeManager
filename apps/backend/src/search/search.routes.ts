import { Elysia } from "elysia";
import { z } from "zod";

import { searchService } from "./search.service";

export const searchRoutes = new Elysia({
	prefix: "/search",
}).post(
	"/",
	async ({ body }) => {
		const results = await searchService.search(body.path, body.query, {
			caseSensitive: body.caseSensitive,
			regex: body.regex,
			wholeWord: body.wholeWord,
		});

		return {
			results,
		};
	},
	{
		body: z.object({
			caseSensitive: z.boolean().optional().default(false),
			path: z.string().min(1),
			query: z.string().min(1),
			regex: z.boolean().optional().default(false),
			wholeWord: z.boolean().optional().default(false),
		}),
	},
);
