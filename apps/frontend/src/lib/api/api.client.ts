import type { Api } from "@claude-manager/backend/api";
import { treaty } from "@elysiajs/eden";

const baseUrl = "http://localhost:3000";

export const api = treaty<Api>(baseUrl, {
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
