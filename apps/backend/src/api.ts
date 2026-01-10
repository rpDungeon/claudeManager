import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

// import { authPlugin } from "./auth/auth.plugin";
import { authRoutes } from "./auth/auth.routes";
import { claudeSessionRoutes } from "./claude/session/session.routes";
import { dashboardRoutes } from "./dashboard/dashboard.routes";
import { editorLspWebsocket } from "./editor/lsp/lsp.websocket";
import { fsRoutes } from "./fs/fs.routes";
import { fsWatchWebsocket } from "./fs/fs.websocket";
import { gitRoutes } from "./git/git.routes";
import { gitWatchWebsocket } from "./git/git.websocket";
import { layoutRoutes } from "./layout/layout.routes";
import { layoutSse } from "./layout/layout.sse";
import { projectRoutes } from "./project/project.routes";
import { proxyRoutes } from "./proxy/proxy.routes";
import { systemRoutes } from "./system/system.routes";
import { systemWebsocket } from "./system/system.websocket";
import { terminalInputlogWebsocket } from "./terminal/inputlog/inputlog.websocket";
import { terminalPtyWebsocket } from "./terminal/pty/pty.websocket";
import { terminalRoutes } from "./terminal/terminal.routes";
import { transcriptionRoutes } from "./transcription/transcription.routes";

export const api = new Elysia()
	.use(
		cors({
			credentials: true,
			origin: true,
		}),
	)
	// .use(authPlugin)
	// .onBeforeHandle(
	// 	{
	// 		as: "global",
	// 	},
	// 	({ user, path, status }) => {
	// 		if (path.startsWith("/auth")) return;
	// 		if (!user)
	// 			return status(401, {
	// 				error: "Unauthorized",
	// 			});
	// 	},
	// )
	.use(authRoutes)
	.use(dashboardRoutes)
	.use(fsRoutes)
	.use(fsWatchWebsocket)
	.use(gitRoutes)
	.use(gitWatchWebsocket)
	.use(layoutRoutes)
	.use(layoutSse)
	.use(projectRoutes)
	.use(proxyRoutes)
	.use(claudeSessionRoutes)
	.use(systemRoutes)
	.use(systemWebsocket)
	.use(terminalRoutes)
	.use(terminalPtyWebsocket)
	.use(terminalInputlogWebsocket)
	.use(transcriptionRoutes)
	.use(editorLspWebsocket);

export type Api = typeof api;
