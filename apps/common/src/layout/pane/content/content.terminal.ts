import { z } from "zod";

import { layoutPaneContentBaseSchema } from "./content.base";

export const layoutPaneContentTerminalSchema = z.object({
	...layoutPaneContentBaseSchema.shape,
	terminalId: z.string(),
	type: z.literal("terminal"),
});

export type LayoutPaneContentTerminal = z.infer<typeof layoutPaneContentTerminalSchema>;
