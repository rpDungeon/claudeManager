import { z } from "zod";

export const systemDiskStatsSchema = z.object({
	free: z.number(),
	total: z.number(),
	used: z.number(),
	usedPercentage: z.number(),
});

export type SystemDiskStats = z.infer<typeof systemDiskStatsSchema>;

export const systemMemoryStatsSchema = z.object({
	free: z.number(),
	total: z.number(),
	used: z.number(),
	usedPercentage: z.number(),
});

export type SystemMemoryStats = z.infer<typeof systemMemoryStatsSchema>;

export const systemStatsSchema = z.object({
	cpuPercentage: z.number(),
	disk: systemDiskStatsSchema,
	memory: systemMemoryStatsSchema,
	ptyCount: z.number(),
	uptime: z.number(),
});

export type SystemStats = z.infer<typeof systemStatsSchema>;

export const systemStatsMessageSchema = z.object({
	...systemStatsSchema.shape,
	type: z.literal("stats"),
});

export type SystemStatsMessage = z.infer<typeof systemStatsMessageSchema>;
