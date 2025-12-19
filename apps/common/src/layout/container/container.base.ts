import { z } from "zod";

export const layoutContainerBaseSchema = z.object({
	childIds: z.array(z.string()),
	id: z.string(),
});

export type LayoutContainerBase = z.infer<typeof layoutContainerBaseSchema>;
