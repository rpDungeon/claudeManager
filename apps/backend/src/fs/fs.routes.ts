import { Elysia } from "elysia";
import { z } from "zod";

import { fsService } from "./fs.service";

export const fsRoutes = new Elysia({
	prefix: "/fs",
}).get(
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
);
