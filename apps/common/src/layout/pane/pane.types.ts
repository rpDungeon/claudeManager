import { z } from "zod";

import { layoutPaneContentSchema } from "./pane.content";
import { layoutPaneSplitSchema } from "./pane.split";

export const layoutPaneNodeSchema = z.union([
	layoutPaneContentSchema,
	layoutPaneSplitSchema,
]);

export type LayoutPaneNode = z.infer<typeof layoutPaneNodeSchema>;
