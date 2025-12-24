import { Elysia } from "elysia";
import { systemService } from "./system.service";

export const systemRoutes = new Elysia({
	prefix: "/system",
}).get("/stats", () => {
	return systemService.statsGet();
});
