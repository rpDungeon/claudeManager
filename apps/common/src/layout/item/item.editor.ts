import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemEditorSchema = z.object({
	...layoutItemBaseSchema.shape,
	filePath: z.string(),
	type: z.literal("editor"),
});

export type LayoutItemEditor = z.infer<typeof layoutItemEditorSchema>;
