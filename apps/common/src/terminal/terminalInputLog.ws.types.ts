import { z } from "zod";

import { terminalIdSchema } from "./terminal.types";

export enum TerminalInputLogWsMessageType {
	Initial = "initial",
	New = "new",
	Heartbeat = "heartbeat",
	Error = "error",
}

export const terminalInputLogEntrySchema = z.object({
	id: z.string(),
	input: z.string(),
	terminalId: terminalIdSchema,
	timestamp: z.coerce.date(),
});

export type TerminalInputLogEntry = z.infer<typeof terminalInputLogEntrySchema>;

export const terminalInputLogWsMessageServerSchema = z.discriminatedUnion("type", [
	z.object({
		logs: z.array(terminalInputLogEntrySchema),
		type: z.literal(TerminalInputLogWsMessageType.Initial),
	}),
	z.object({
		log: terminalInputLogEntrySchema,
		type: z.literal(TerminalInputLogWsMessageType.New),
	}),
	z.object({
		type: z.literal(TerminalInputLogWsMessageType.Heartbeat),
	}),
	z.object({
		message: z.string(),
		type: z.literal(TerminalInputLogWsMessageType.Error),
	}),
]);

export type TerminalInputLogWsMessageServer = z.infer<typeof terminalInputLogWsMessageServerSchema>;
