import { z } from "zod";

import { createPrefixedId } from "../../types/id.utils";

const TERMINAL_SHORTCUT_PREFIX = "tsc";

export const terminalShortcutIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${TERMINAL_SHORTCUT_PREFIX}:`), "Invalid TerminalShortcutId")
	.brand("TerminalShortcutId");

export type TerminalShortcutId = z.infer<typeof terminalShortcutIdSchema>;

export const terminalShortcutIdGenerate = createPrefixedId(TERMINAL_SHORTCUT_PREFIX) as () => TerminalShortcutId;
