import { z } from "zod";

import { layoutContainerSplitSchema } from "./container.split";
import { layoutContainerTabsSchema } from "./container.tabs";

export const layoutContainerSchema = z.discriminatedUnion("type", [
	layoutContainerTabsSchema,
	layoutContainerSplitSchema,
]);

export type LayoutContainer = z.infer<typeof layoutContainerSchema>;
