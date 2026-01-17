import type { Api } from "@claude-manager/backend/api";
import { treaty } from "@elysiajs/eden";
import { PUBLIC_BACKEND_HOST, PUBLIC_BACKEND_PORT, PUBLIC_BACKEND_PROTOCOL } from "$env/static/public";

const portSuffix = PUBLIC_BACKEND_PORT ? `:${PUBLIC_BACKEND_PORT}` : "";
export const backendUrl = `${PUBLIC_BACKEND_PROTOCOL}://${PUBLIC_BACKEND_HOST}${portSuffix}`;
export const backendHost = `${PUBLIC_BACKEND_HOST}${portSuffix}`;

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

export type { Api };
