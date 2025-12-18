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
	Output = "output",
}

export type TerminalPtyMessageServerOutput = {
	data: string;
	type: TerminalPtyMessageServerType.Output;
};

export type TerminalPtyMessageServerExit = {
	code: number;
	type: TerminalPtyMessageServerType.Exit;
};

export type TerminalPtyMessageServerError = {
	message: string;
	type: TerminalPtyMessageServerType.Error;
};

export type TerminalPtyMessageServer =
	| TerminalPtyMessageServerError
	| TerminalPtyMessageServerExit
	| TerminalPtyMessageServerOutput;
