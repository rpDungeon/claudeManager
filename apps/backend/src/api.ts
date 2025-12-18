import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authPlugin } from "./auth/auth.plugin";
import { authRoutes } from "./auth/auth.routes";
import { claudeSessionRoutes } from "./claude/session/session.routes";
import { layoutRoutes } from "./layout/layout.routes";
import { projectRoutes } from "./project/project.routes";
import { terminalPtyWebsocket } from "./terminal/pty/pty.websocket";
import { terminalRoutes } from "./terminal/terminal.routes";

export const api = new Elysia()
	.use(
		cors({
			credentials: true,
			origin: true,
		}),
	)
	.use(authPlugin)
	.onBeforeHandle(
		{
			as: "global",
		},
		({ user, path, status }) => {
			if (path.startsWith("/auth")) return;
			if (path.startsWith("/ws")) return;
			if (!user)
				return status(401, {
					error: "Unauthorized",
				});
		},
	)
	.use(authRoutes)
	.use(layoutRoutes)
	.use(projectRoutes)
	.use(claudeSessionRoutes)
	.use(terminalRoutes)
	.use(terminalPtyWebsocket);

export type Api = typeof api;
