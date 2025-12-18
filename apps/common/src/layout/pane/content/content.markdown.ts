import { z } from "zod";

import { layoutPaneContentBaseSchema } from "./content.base";

export const layoutPaneContentMarkdownSchema = z.object({
	...layoutPaneContentBaseSchema.shape,
	content: z.string(),
	type: z.literal("markdown"),
});

export type LayoutPaneContentMarkdown = z.infer<typeof layoutPaneContentMarkdownSchema>;
