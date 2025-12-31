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

export const terminalPtyMessageClientSchema = z.discriminatedUnion("type", [
	terminalPtyMessageInputSchema,
	terminalPtyMessageResizeSchema,
]);

export type TerminalPtyMessageClient = z.infer<typeof terminalPtyMessageClientSchema>;

export enum TerminalPtyMessageServerType {
	Error = "error",
	Exit = "exit",
	ForegroundProcess = "foreground_process",
	Output = "output",
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

export const terminalPtyMessageServerSchema = z.discriminatedUnion("type", [
	terminalPtyMessageServerOutputSchema,
	terminalPtyMessageServerExitSchema,
	terminalPtyMessageServerErrorSchema,
	terminalPtyMessageServerForegroundProcessSchema,
]);

export type TerminalPtyMessageServer = z.infer<typeof terminalPtyMessageServerSchema>;
