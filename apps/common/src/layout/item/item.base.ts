import { z } from "zod";

export const layoutItemBaseSchema = z.object({
	id: z.string(),
	label: z.string().optional(),
});

export type LayoutItemBase = z.infer<typeof layoutItemBaseSchema>;
