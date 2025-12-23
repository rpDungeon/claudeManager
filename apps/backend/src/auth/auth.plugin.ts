import { bearer as bearerPlugin } from "@elysiajs/bearer";
import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { Elysia } from "elysia";

import "../common/common.env";

export const authPlugin = new Elysia({
	name: "auth",
})
	.use(
		jwtPlugin({
			name: "jwt",
			secret: Bun.env.JWT_SECRET,
		}),
	)
	.use(bearerPlugin())
	.derive(
		{
			as: "scoped",
		},
		async ({ jwt, bearer }) => {
			const payload = await jwt.verify(bearer);
			return {
				user: payload
					? {
							authenticated: true,
						}
					: null,
			};
		},
	)
	.as("scoped");
