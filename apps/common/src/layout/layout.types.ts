import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { layoutContainerSchema } from "./container/container.types";
import { layoutItemSchema } from "./item/item.types";

export const layoutArrangementSchema = z.object({
	containers: z.record(z.string(), layoutContainerSchema),
	rootId: z.string().nullable(),
});

export const layoutDataSchema = z.object({
	desktop: layoutArrangementSchema,
	items: z.record(z.string(), layoutItemSchema),
	mobile: layoutArrangementSchema,
});

const layoutDataDefault: LayoutData = {
	desktop: {
		containers: {},
		rootId: null,
	},
	items: {},
	mobile: {
		containers: {},
		rootId: null,
	},
};

export const layoutCreate = z.object({
	data: layoutDataSchema.default(layoutDataDefault),
	name: z.string().min(1),
});

export const layoutPatch = z.object({
	data: layoutDataSchema.optional(),
	name: z.string().min(1).optional(),
});

export type Layout = InferSelectModel<typeof import("./layout.schema").layoutSchema>;
export type LayoutArrangement = z.infer<typeof layoutArrangementSchema>;
export type LayoutData = z.infer<typeof layoutDataSchema>;
