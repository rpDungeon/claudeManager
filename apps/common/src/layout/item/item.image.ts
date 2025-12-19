import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemImageSchema = z.object({
	...layoutItemBaseSchema.shape,
	alt: z.string().optional(),
	src: z.string(),
	type: z.literal("image"),
});

export type LayoutItemImage = z.infer<typeof layoutItemImageSchema>;
