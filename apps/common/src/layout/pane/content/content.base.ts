import { z } from "zod";

export const layoutPaneContentBaseSchema = z.object({
	id: z.string(),
	parentId: z.string().nullable(),
});

export type LayoutPaneContentBase = z.infer<typeof layoutPaneContentBaseSchema>;
