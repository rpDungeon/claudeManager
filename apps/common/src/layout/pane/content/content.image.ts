import { z } from "zod";

import { layoutPaneContentBaseSchema } from "./content.base";

export const layoutPaneContentImageSchema = z.object({
	...layoutPaneContentBaseSchema.shape,
	alt: z.string().optional(),
	src: z.string(),
	type: z.literal("image"),
});

export type LayoutPaneContentImage = z.infer<typeof layoutPaneContentImageSchema>;
