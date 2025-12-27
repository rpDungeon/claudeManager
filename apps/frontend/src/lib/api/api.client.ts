import type { Api } from "@claude-manager/backend/api";
import { treaty } from "@elysiajs/eden";
import { PUBLIC_API_URL } from "$env/static/public";

export const api = treaty<Api>(PUBLIC_API_URL, {
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
