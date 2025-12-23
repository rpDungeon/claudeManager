import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { projectIdSchema } from "../../project/project.id";
import { claudeSessionExternalIdSchema } from "./claudeSession.id";

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
