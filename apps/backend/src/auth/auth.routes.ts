import { Elysia, t } from "elysia";

import { authPlugin } from "./auth.plugin";

export const authRoutes = new Elysia({
	prefix: "/auth",
})
	.use(authPlugin)
	.post(
		"/login",
		async ({ body, jwt, set }) => {
			if (body.password !== Bun.env.MASTER_PASSWORD) {
				set.status = 401;
				return {
					error: "Invalid password",
				};
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
			body: t.Object({
				password: t.String(),
			}),
		},
	)
	.get("/verify", async ({ headers, jwt, set }) => {
		const authHeader = headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			set.status = 401;
			return {
				authenticated: false,
			};
		}

		const token = authHeader.slice(7);
		const payload = await jwt.verify(token);

		if (!payload) {
			set.status = 401;
			return {
				authenticated: false,
			};
		}

		return {
			authenticated: true,
		};
	});
