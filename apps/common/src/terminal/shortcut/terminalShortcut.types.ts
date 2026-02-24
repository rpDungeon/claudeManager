import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { terminalShortcutIdSchema } from "./terminalShortcut.id";

export const terminalShortcutCreate = z.object({
	color: z.string().nullable().optional(),
	command: z.string().min(1),
	label: z.string().min(1),
	sendCtrlC: z.boolean().optional(),
	sendEnter: z.boolean().optional(),
	sortOrder: z.number().int().nonnegative(),
});

export const terminalShortcutPatch = z.object({
	color: z.string().nullable().optional(),
	command: z.string().min(1).optional(),
	label: z.string().min(1).optional(),
	sendCtrlC: z.boolean().optional(),
	sendEnter: z.boolean().optional(),
	sortOrder: z.number().int().nonnegative().optional(),
});

export const terminalShortcutReorder = z.array(
	z.object({
		id: terminalShortcutIdSchema,
		sortOrder: z.number().int().nonnegative(),
	}),
);

export type TerminalShortcutCreate = z.infer<typeof terminalShortcutCreate>;
export type TerminalShortcutPatch = z.infer<typeof terminalShortcutPatch>;
export type TerminalShortcutReorder = z.infer<typeof terminalShortcutReorder>;
export type TerminalShortcut = InferSelectModel<typeof import("./terminalShortcut.schema").terminalShortcutSchema>;
