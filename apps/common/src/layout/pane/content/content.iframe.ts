import { z } from "zod";

import { layoutPaneContentBaseSchema } from "./content.base";

export const layoutPaneContentIframeSchema = z.object({
	...layoutPaneContentBaseSchema.shape,
	title: z.string().optional(),
	type: z.literal("iframe"),
	url: z.url(),
});

export type LayoutPaneContentIframe = z.infer<typeof layoutPaneContentIframeSchema>;
