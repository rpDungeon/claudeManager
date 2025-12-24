import { z } from "zod";

export type SystemMemoryStats = {
	free: number;
	total: number;
	used: number;
	usedPercentage: number;
};

export type SystemStats = {
	cpuPercentage: number;
	memory: SystemMemoryStats;
	ptyCount: number;
	uptime: number;
};

export const systemStatsMessageSchema = z.object({
	cpuPercentage: z.number(),
	memory: z.object({
		free: z.number(),
		total: z.number(),
		used: z.number(),
		usedPercentage: z.number(),
	}),
	ptyCount: z.number(),
	type: z.literal("stats"),
	uptime: z.number(),
});

export type SystemStatsMessage = z.infer<typeof systemStatsMessageSchema>;
