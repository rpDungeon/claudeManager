import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { Elysia } from "elysia";

import { systemRoutes } from "./system.routes";

const app = new Elysia().use(systemRoutes);
const api = treaty(app);

describe("system routes", () => {
	describe("GET /system/stats", () => {
		it("returns system statistics", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data).toBeDefined();
		});

		it("returns cpuPercentage as a number", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(typeof data.cpuPercentage).toBe("number");
			expect(data.cpuPercentage).toBeGreaterThanOrEqual(0);
			expect(data.cpuPercentage).toBeLessThanOrEqual(100);
		});

		it("returns memory stats with correct shape", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(data.memory).toBeDefined();
			expect(typeof data.memory.total).toBe("number");
			expect(typeof data.memory.free).toBe("number");
			expect(typeof data.memory.used).toBe("number");
			expect(typeof data.memory.usedPercentage).toBe("number");

			expect(data.memory.total).toBeGreaterThan(0);
			expect(data.memory.free).toBeGreaterThanOrEqual(0);
			expect(data.memory.used).toBeGreaterThanOrEqual(0);
			expect(data.memory.usedPercentage).toBeGreaterThanOrEqual(0);
			expect(data.memory.usedPercentage).toBeLessThanOrEqual(100);
		});

		it("returns memory values that add up correctly", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			const expectedUsed = data.memory.total - data.memory.free;
			expect(data.memory.used).toBe(expectedUsed);
		});

		it("returns ptyCount as a non-negative number", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(typeof data.ptyCount).toBe("number");
			expect(data.ptyCount).toBeGreaterThanOrEqual(0);
		});

		it("returns uptime as a positive number", async () => {
			const { data, error } = await api.system.stats.get();

			expect(error).toBeNull();
			if (error) throw error;

			expect(typeof data.uptime).toBe("number");
			expect(data.uptime).toBeGreaterThan(0);
		});

		it("returns valid CPU percentage on subsequent calls", async () => {
			const { data: first, error: error1 } = await api.system.stats.get();

			expect(error1).toBeNull();
			if (error1) throw error1;

			expect(first.cpuPercentage).toBeGreaterThanOrEqual(0);
			expect(first.cpuPercentage).toBeLessThanOrEqual(100);

			const { data: second, error: error2 } = await api.system.stats.get();

			expect(error2).toBeNull();
			if (error2) throw error2;

			expect(second.cpuPercentage).toBeGreaterThanOrEqual(0);
			expect(second.cpuPercentage).toBeLessThanOrEqual(100);
		});
	});
});
