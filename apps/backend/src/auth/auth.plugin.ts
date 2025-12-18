import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

export const authPlugin = new Elysia({
	name: "auth",
})
	.use(
		jwt({
			name: "jwt",
			secret: Bun.env.JWT_SECRET,
		}),
	)
	.use(bearer())
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
