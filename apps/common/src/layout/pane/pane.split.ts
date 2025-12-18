import { z } from "zod";

import { percentageSchema } from "../../types/common.types";
import { layoutPaneContentBaseSchema } from "./content/content.base";

export const layoutPaneSplitSchema = z.object({
	...layoutPaneContentBaseSchema.shape,
	childIds: z.array(z.string()),
	direction: z.enum([
		"horizontal",
		"vertical",
	]),
	sizes: z.array(percentageSchema),
	type: z.literal("split"),
});

export type LayoutPaneSplit = z.infer<typeof layoutPaneSplitSchema>;
