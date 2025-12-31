import type { ProxyPort } from "./proxy.types";
import { proxyContentTypeIsRewritable } from "./proxy.types";

class ProxyService {
	baseUrlGet(request: Request): string {
		const host = request.headers.get("host") || "localhost:4030";
		const protocol = request.headers.get("x-forwarded-proto") || "http";
		return `${protocol}://${host}`;
	}

	localhostUrlsRewrite(body: string, baseUrl: string): string {
		const localhostRegex = /(?:https?:)?\/\/localhost:(\d+)/g;

		return body.replace(localhostRegex, (_match, port) => {
			const host = new URL(baseUrl).host;
			return `//${host}/proxy/${port}`;
		});
	}

	async httpRequestProxy(port: ProxyPort, path: string, request: Request): Promise<Response> {
		const targetUrl = `http://localhost:${port}${path}`;

		const forwardHeaders = new Headers(request.headers);
		forwardHeaders.delete("host");

		const proxyRequest = new Request(targetUrl, {
			body: request.body,
			headers: forwardHeaders,
			method: request.method,
			redirect: "manual",
		});

		try {
			const response = await fetch(proxyRequest);

			const contentType = response.headers.get("content-type");

			if (proxyContentTypeIsRewritable(contentType)) {
				const body = await response.text();
				const baseUrl = this.baseUrlGet(request);
				const rewrittenBody = this.localhostUrlsRewrite(body, baseUrl);

				const newHeaders = new Headers(response.headers);
				newHeaders.set("content-length", String(Buffer.byteLength(rewrittenBody)));

				return new Response(rewrittenBody, {
					headers: newHeaders,
					status: response.status,
					statusText: response.statusText,
				});
			}

			return response;
		} catch (error) {
			console.error(`[Proxy] Failed to proxy to localhost:${port}:`, error);
			return new Response(
				JSON.stringify({
					error: "Proxy target unreachable",
					message: error instanceof Error ? error.message : String(error),
					port,
				}),
				{
					headers: {
						"Content-Type": "application/json",
					},
					status: 502,
				},
			);
		}
	}
}

export const proxyService = new ProxyService();
