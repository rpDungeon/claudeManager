import { z } from "zod";

import { terminalIdSchema } from "../../terminal/terminal.types";
import { layoutItemBaseSchema } from "./item.base";

export const layoutItemTerminalSchema = z.object({
	...layoutItemBaseSchema.shape,
	terminalId: terminalIdSchema,
	type: z.literal("terminal"),
});

export type LayoutItemTerminal = z.infer<typeof layoutItemTerminalSchema>;
