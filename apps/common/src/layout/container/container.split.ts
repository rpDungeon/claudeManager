import { z } from "zod";

import { percentageSchema } from "../../types/common.types";
import { layoutContainerBaseSchema } from "./container.base";

export const layoutContainerSplitSchema = z
	.object({
		...layoutContainerBaseSchema.shape,
		direction: z.enum([
			"horizontal",
			"vertical",
		]),
		sizes: z.array(percentageSchema),
		type: z.literal("split"),
	})
	.refine((data) => data.sizes.length === data.childIds.length, {
		message: "sizes array length must match childIds length",
		path: [
			"sizes",
		],
	})
	.refine(
		(data) => {
			const sum = data.sizes.reduce((acc, size) => acc + size, 0);
			return Math.abs(sum - 100) < 0.01;
		},
		{
			message: "sizes must sum to 100",
			path: [
				"sizes",
			],
		},
	);

export type LayoutContainerSplit = z.infer<typeof layoutContainerSplitSchema>;
