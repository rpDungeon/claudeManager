import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { createPrefixedId } from "../types/id.utils";

const TERMINAL_PREFIX = "terminal";

export const terminalIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${TERMINAL_PREFIX}:`), "Invalid TerminalId")
	.brand("TerminalId");

export type TerminalId = z.infer<typeof terminalIdSchema>;

export const terminalIdGenerate = createPrefixedId(TERMINAL_PREFIX) as () => TerminalId;

export enum TerminalType {
	Shell = "shell",
	Claude = "claude",
}

export const terminalCreate = z.object({
	claudeSessionId: z.string().optional(),
	layoutConfig: z.string().optional(),
	name: z.string().min(1),
	projectId: z.string(),
	type: z.nativeEnum(TerminalType),
});

export const terminalUpdate = terminalCreate.extend({
	id: terminalIdSchema,
});

export type Terminal = InferSelectModel<typeof import("./terminal.schema").terminalSchema>;
