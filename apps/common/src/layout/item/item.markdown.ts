import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemMarkdownSchema = z.object({
	...layoutItemBaseSchema.shape,
	content: z.string(),
	type: z.literal("markdown"),
});

export type LayoutItemMarkdown = z.infer<typeof layoutItemMarkdownSchema>;
