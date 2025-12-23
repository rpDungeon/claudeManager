import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { projectIdSchema } from "../../project/project.types";
import { createPrefixedId } from "../../types/id.utils";

const CLAUDE_SESSION_PREFIX = "claudeSession";

export const claudeSessionIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${CLAUDE_SESSION_PREFIX}:`), "Invalid ClaudeSessionId")
	.brand("ClaudeSessionId");

export type ClaudeSessionId = z.infer<typeof claudeSessionIdSchema>;

export const claudeSessionIdGenerate = createPrefixedId(CLAUDE_SESSION_PREFIX) as () => ClaudeSessionId;

export const claudeSessionExternalIdSchema = z.string().min(1).brand("ClaudeSessionExternalId");

export type ClaudeSessionExternalId = z.infer<typeof claudeSessionExternalIdSchema>;

export enum ClaudeSessionStatus {
	Active = "active",
	Idle = "idle",
	Paused = "paused",
	Completed = "completed",
	Error = "error",
}

export const claudeSessionCreate = z.object({
	description: z.string().optional(),
	externalSessionId: claudeSessionExternalIdSchema,
	name: z.string().optional(),
	projectId: projectIdSchema,
});

export const claudeSessionPatch = z.object({
	description: z.string().optional(),
	name: z.string().optional(),
	status: z.nativeEnum(ClaudeSessionStatus).optional(),
});

export type ClaudeSession = InferSelectModel<typeof import("./claudeSession.schema").claudeSessionSchema>;
