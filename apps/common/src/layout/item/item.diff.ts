import { z } from "zod";

import { layoutItemBaseSchema } from "./item.base";

export const layoutItemDiffSchema = z.object({
	...layoutItemBaseSchema.shape,
	filePath: z.string(),
	repoPath: z.string(),
	staged: z.boolean(),
	type: z.literal("diff"),
});

export type LayoutItemDiff = z.infer<typeof layoutItemDiffSchema>;
