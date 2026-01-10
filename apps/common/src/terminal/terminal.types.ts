import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { claudeSessionIdSchema } from "../claude/session/claudeSession.id";
import { projectIdSchema } from "../project/project.id";
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
	claudeSessionId: claudeSessionIdSchema.optional(),
	layoutConfig: z.string().optional(),
	name: z.string().min(1),
	projectId: projectIdSchema,
	type: z.nativeEnum(TerminalType),
});

export const terminalPatch = z.object({
	claudeSessionId: claudeSessionIdSchema.optional(),
	color: z.string().nullable().optional(),
	layoutConfig: z.string().optional(),
	name: z.string().min(1).optional(),
});

export type TerminalCreate = z.infer<typeof terminalCreate>;
export type TerminalPatch = z.infer<typeof terminalPatch>;
export type Terminal = InferSelectModel<typeof import("./terminal.schema").terminalSchema>;
