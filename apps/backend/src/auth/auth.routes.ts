import { Elysia } from "elysia";
import { z } from "zod";

import { authPlugin } from "./auth.plugin";

export const authRoutes = new Elysia({
	prefix: "/auth",
})
	.use(authPlugin)
	.post(
		"/login",
		async ({ body, jwt, status }) => {
			if (body.password !== Bun.env.MASTER_PASSWORD) {
				return status(401, {
					message: "Invalid password",
				});
			}

			const token = await jwt.sign({
				authenticated: true,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
			});

			return {
				token,
			};
		},
		{
			body: z.object({
				password: z.string(),
			}),
		},
	)
	.get("/verify", async ({ headers, jwt, status }) => {
		const authHeader = headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return status(401, {
				authenticated: false,
			});
		}

		const token = authHeader.slice(7);
		const payload = await jwt.verify(token);

		if (!payload) {
			return status(401, {
				authenticated: false,
			});
		}

		return {
			authenticated: true,
		};
	});
