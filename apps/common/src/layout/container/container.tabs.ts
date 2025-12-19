import { z } from "zod";

import { layoutContainerBaseSchema } from "./container.base";

export const layoutContainerTabsSchema = z.object({
	...layoutContainerBaseSchema.shape,
	activeTabId: z.string().nullable(),
	type: z.literal("tabs"),
});

export type LayoutContainerTabs = z.infer<typeof layoutContainerTabsSchema>;
