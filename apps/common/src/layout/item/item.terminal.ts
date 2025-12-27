import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemTerminalSchema = z.object({
	...layoutItemBaseSchema.shape,
	type: z.literal("terminal"),
});

export type LayoutItemTerminal = z.infer<typeof layoutItemTerminalSchema>;
