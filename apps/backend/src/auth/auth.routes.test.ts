import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { Elysia } from "elysia";
import { authRoutes } from "./auth.routes";

const app = new Elysia().use(authRoutes);
const api = treaty(app);

describe("auth routes", () => {
	describe("POST /auth/login", () => {
		it("returns a token with correct password", async () => {
			const { data, error, status } = await api.auth.login.post({
				password: Bun.env.MASTER_PASSWORD,
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.token).toBeDefined();
			expect(typeof data.token).toBe("string");
			expect(data.token.length).toBeGreaterThan(0);
		});

		it("returns 401 with incorrect password", async () => {
			const { error, status } = await api.auth.login.post({
				password: "wrong-password",
			});

			expect(status).toBe(401);
			expect(error?.value).toHaveProperty("message", "Invalid password");
		});

		it("returns 401 with empty password", async () => {
			const { status } = await api.auth.login.post({
				password: "",
			});

			expect(status).toBe(401);
		});
	});

	describe("GET /auth/verify", () => {
		it("returns authenticated true with valid token", async () => {
			const loginResult = await api.auth.login.post({
				password: Bun.env.MASTER_PASSWORD,
			});

			expect(loginResult.error).toBeNull();
			if (loginResult.error) throw loginResult.error;

			const { data, error, status } = await api.auth.verify.get({
				headers: {
					authorization: `Bearer ${loginResult.data.token}`,
				},
			});

			expect(error).toBeNull();
			if (error) throw error;

			expect(status).toBe(200);
			expect(data.authenticated).toBe(true);
		});

		it("returns 401 without authorization header", async () => {
			const { error, status } = await api.auth.verify.get();

			expect(status).toBe(401);
			expect(error?.value).toHaveProperty("authenticated", false);
		});

		it("returns 401 with invalid token", async () => {
			const { error, status } = await api.auth.verify.get({
				headers: {
					authorization: "Bearer invalid-token-here",
				},
			});

			expect(status).toBe(401);
			expect(error?.value).toHaveProperty("authenticated", false);
		});

		it("returns 401 with malformed authorization header", async () => {
			const { status } = await api.auth.verify.get({
				headers: {
					authorization: "NotBearer token",
				},
			});

			expect(status).toBe(401);
		});
	});
});
