import type { Api } from "@claude-manager/backend/api";
import { treaty } from "@elysiajs/eden";
import { PUBLIC_BACKEND_PORT, PUBLIC_BACKEND_PORT_TLS } from "$env/static/public";

function backendPortGet(): string {
	if (typeof window === "undefined") return PUBLIC_BACKEND_PORT || "4030";
	const isSecure = window.location.protocol === "https:";
	return isSecure ? PUBLIC_BACKEND_PORT_TLS || PUBLIC_BACKEND_PORT || "4031" : PUBLIC_BACKEND_PORT || "4030";
}

function backendUrlGet(): string {
	if (typeof window === "undefined") {
		return `http://localhost:${backendPortGet()}`;
	}
	const protocol = window.location.protocol;
	const host = window.location.hostname;
	return `${protocol}//${host}:${backendPortGet()}`;
}

function backendHostGet(): string {
	if (typeof window === "undefined") {
		return `localhost:${backendPortGet()}`;
	}
	const host = window.location.hostname;
	return `${host}:${backendPortGet()}`;
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
