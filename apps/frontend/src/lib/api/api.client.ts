import type { Api } from "@claude-manager/backend/api";
import { treaty } from "@elysiajs/eden";
import { PUBLIC_BACKEND_PORT } from "$env/static/public";

function backendUrlGet(): string {
	if (typeof window === "undefined") {
		return `http://localhost:${PUBLIC_BACKEND_PORT || "4030"}`;
	}
	const protocol = window.location.protocol;
	const host = window.location.hostname;
	const port = PUBLIC_BACKEND_PORT || "4030";
	return `${protocol}//${host}:${port}`;
}

function backendHostGet(): string {
	if (typeof window === "undefined") {
		return `localhost:${PUBLIC_BACKEND_PORT || "4030"}`;
	}
	const host = window.location.hostname;
	const port = PUBLIC_BACKEND_PORT || "4030";
	return `${host}:${port}`;
}

export const backendUrl = backendUrlGet();
export const backendHost = backendHostGet();

export const api = treaty<Api>(backendUrl, {
	headers: (): Record<string, string> => {
		if (typeof localStorage === "undefined") return {};
		const token = localStorage.getItem("auth_token");
		if (!token) return {};
		return {
			authorization: `Bearer ${token}`,
		};
	},
});

export function authTokenQueryGet():
	| {
			token: string;
	  }
	| undefined {
	if (typeof localStorage === "undefined") return undefined;
	const token = localStorage.getItem("auth_token");
	if (!token) return undefined;
	return {
		token,
	};
}

export type { Api };
