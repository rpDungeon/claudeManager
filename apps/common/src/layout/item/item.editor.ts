import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemEditorSchema = z.object({
	...layoutItemBaseSchema.shape,
	type: z.literal("editor"),
	filePath: z.string(),
});

export type LayoutItemEditor = z.infer<typeof layoutItemEditorSchema>;
