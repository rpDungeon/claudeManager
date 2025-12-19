import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemIframeSchema = z.object({
	...layoutItemBaseSchema.shape,
	type: z.literal("iframe"),
	url: z.url(),
});

export type LayoutItemIframe = z.infer<typeof layoutItemIframeSchema>;
