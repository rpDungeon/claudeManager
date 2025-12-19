import { z } from "zod";

import { percentageSchema } from "../../types/common.types";
import { layoutContainerBaseSchema } from "./container.base";

export const layoutContainerSplitSchema = z.object({
	...layoutContainerBaseSchema.shape,
	direction: z.enum([
		"horizontal",
		"vertical",
	]),
	sizes: z.array(percentageSchema),
	type: z.literal("split"),
});

export type LayoutContainerSplit = z.infer<typeof layoutContainerSplitSchema>;
