import { Elysia } from "elysia";
import { z } from "zod";
import { proxyService } from "./proxy.service";
import type { ProxyPort } from "./proxy.types";
import { proxyPortIsValid } from "./proxy.types";

type ProxyWsData = {
	targetWs?: WebSocket | null;
	params: {
		port: string;
		"*"?: string;
	};
	request: Request;
};

const PROXY_PATH_REGEX = /^\/proxy\/\d+(\/.*)?$/;

function pathExtract(requestUrl: string): string {
	const url = new URL(requestUrl);
	const pathMatch = url.pathname.match(PROXY_PATH_REGEX);
	const path = pathMatch?.[1] || "/";
	const query = url.search;
	return `${path}${query}`;
}

export const proxyRoutes = new Elysia({
	prefix: "/proxy",
})
	.all(
		"/:port",
		async ({ params, request, set }) => {
			const portNum = Number(params.port);

			if (!proxyPortIsValid(portNum)) {
				set.status = 400;
				return {
					error: "Invalid port",
					message: "Port not in allowed proxy ranges",
				};
			}

			return proxyService.httpRequestProxy(portNum as ProxyPort, "/", request);
		},
		{
			params: z.object({
				port: z.string(),
			}),
		},
	)
	.all(
		"/:port/*",
		async ({ params, request, set }) => {
			const portNum = Number(params.port);

			if (!proxyPortIsValid(portNum)) {
				set.status = 400;
				return {
					error: "Invalid port",
					message: "Port not in allowed proxy ranges",
				};
			}

			const path = pathExtract(request.url);

			return proxyService.httpRequestProxy(portNum as ProxyPort, path, request);
		},
		{
			params: z.object({
				"*": z.string(),
				port: z.string(),
			}),
		},
	)
	.ws("/:port", {
		close(ws) {
			const targetWs = (ws.data as ProxyWsData).targetWs;
			if (targetWs) {
				targetWs.close();
			}
		},

		message(ws, message) {
			const targetWs = (ws.data as ProxyWsData).targetWs;
			if (targetWs && targetWs.readyState === WebSocket.OPEN) {
				if (typeof message === "string") {
					targetWs.send(message);
				} else if (message instanceof ArrayBuffer || ArrayBuffer.isView(message)) {
					targetWs.send(message);
				} else {
					targetWs.send(JSON.stringify(message));
				}
			}
		},
		open(ws) {
			const { port } = ws.data.params as ProxyWsData["params"];
			const portNum = Number(port);

			if (!proxyPortIsValid(portNum)) {
				ws.close(1008, "Invalid port");
				return;
			}

			const targetWsUrl = `ws://localhost:${portNum}/`;

			try {
				const targetWs = new WebSocket(targetWsUrl);
				(ws.data as ProxyWsData).targetWs = targetWs;

				targetWs.onmessage = (event) => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(event.data);
					}
				};

				targetWs.onerror = (error) => {
					console.error(`[Proxy WS] Error connecting to ${targetWsUrl}:`, error);
					ws.close(1011, "Target WebSocket error");
				};

				targetWs.onclose = () => {
					ws.close();
				};
			} catch (error) {
				console.error(`[Proxy WS] Failed to connect to ${targetWsUrl}:`, error);
				ws.close(1011, "Failed to connect to target");
			}
		},

		params: z.object({
			port: z.string(),
		}),
	})
	.ws("/:port/*", {
		close(ws) {
			const targetWs = (ws.data as ProxyWsData).targetWs;
			if (targetWs) {
				targetWs.close();
			}
		},

		message(ws, message) {
			const targetWs = (ws.data as ProxyWsData).targetWs;
			if (targetWs && targetWs.readyState === WebSocket.OPEN) {
				if (typeof message === "string") {
					targetWs.send(message);
				} else if (message instanceof ArrayBuffer || ArrayBuffer.isView(message)) {
					targetWs.send(message);
				} else {
					targetWs.send(JSON.stringify(message));
				}
			}
		},
		open(ws) {
			const params = ws.data.params as ProxyWsData["params"];
			const port = params.port;
			const portNum = Number(port);

			if (!proxyPortIsValid(portNum)) {
				ws.close(1008, "Invalid port");
				return;
			}

			const path = `/${params["*"]}`;
			const targetWsUrl = `ws://localhost:${portNum}${path}`;

			try {
				const targetWs = new WebSocket(targetWsUrl);
				(ws.data as ProxyWsData).targetWs = targetWs;

				targetWs.onmessage = (event) => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(event.data);
					}
				};

				targetWs.onerror = (error) => {
					console.error(`[Proxy WS] Error connecting to ${targetWsUrl}:`, error);
					ws.close(1011, "Target WebSocket error");
				};

				targetWs.onclose = () => {
					ws.close();
				};
			} catch (error) {
				console.error(`[Proxy WS] Failed to connect to ${targetWsUrl}:`, error);
				ws.close(1011, "Failed to connect to target");
			}
		},

		params: z.object({
			"*": z.string(),
			port: z.string(),
		}),
	});
