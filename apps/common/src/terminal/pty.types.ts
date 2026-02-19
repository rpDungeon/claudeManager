import { z } from "zod";

const terminalPtyMessageInputSchema = z.object({
	data: z.string(),
	type: z.literal("input"),
});

const terminalPtyMessageResizeSchema = z.object({
	cols: z.number().int().positive(),
	rows: z.number().int().positive(),
	type: z.literal("resize"),
});

const terminalPtyMessagePongSchema = z.object({
	type: z.literal("pong"),
});

export const terminalPtyMessageClientSchema = z.discriminatedUnion("type", [
	terminalPtyMessageInputSchema,
	terminalPtyMessageResizeSchema,
	terminalPtyMessagePongSchema,
]);

export type TerminalPtyMessageClient = z.infer<typeof terminalPtyMessageClientSchema>;

export enum TerminalPtyMessageServerType {
	Error = "error",
	Exit = "exit",
	ForegroundProcess = "foreground_process",
	Output = "output",
	OutputIdle = "output_idle",
	Ping = "ping",
}

const terminalPtyMessageServerOutputSchema = z.object({
	data: z.string(),
	type: z.literal(TerminalPtyMessageServerType.Output),
});

const terminalPtyMessageServerExitSchema = z.object({
	code: z.number(),
	type: z.literal(TerminalPtyMessageServerType.Exit),
});

const terminalPtyMessageServerErrorSchema = z.object({
	message: z.string(),
	type: z.literal(TerminalPtyMessageServerType.Error),
});

const terminalPtyMessageServerForegroundProcessSchema = z.object({
	process: z.string().nullable(),
	type: z.literal(TerminalPtyMessageServerType.ForegroundProcess),
});

const terminalPtyMessageServerOutputIdleSchema = z.object({
	idle: z.boolean(),
	type: z.literal(TerminalPtyMessageServerType.OutputIdle),
});

const terminalPtyMessageServerPingSchema = z.object({
	type: z.literal(TerminalPtyMessageServerType.Ping),
});

export const terminalPtyMessageServerSchema = z.discriminatedUnion("type", [
	terminalPtyMessageServerOutputSchema,
	terminalPtyMessageServerExitSchema,
	terminalPtyMessageServerErrorSchema,
	terminalPtyMessageServerForegroundProcessSchema,
	terminalPtyMessageServerOutputIdleSchema,
	terminalPtyMessageServerPingSchema,
]);

export type TerminalPtyMessageServer = z.infer<typeof terminalPtyMessageServerSchema>;
