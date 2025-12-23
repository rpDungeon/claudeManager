import { z } from "zod";

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
