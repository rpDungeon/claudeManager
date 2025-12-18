import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { createPrefixedId } from "../types/id.utils";
import { layoutPaneNodeSchema } from "./pane/pane.types";

const LAYOUT_PREFIX = "layout";

export const layoutArrangementSchema = z.object({
	nodes: z.record(z.string(), layoutPaneNodeSchema),
	rootId: z.string().nullable(),
});

export const layoutCreate = z.object({
	desktop: layoutArrangementSchema.optional(),
	mobile: layoutArrangementSchema.optional(),
	name: z.string().min(1),
});

export const layoutIdGenerate = createPrefixedId(LAYOUT_PREFIX) as () => LayoutId;

export const layoutIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${LAYOUT_PREFIX}:`), "Invalid LayoutId")
	.brand("LayoutId");

export const layoutUpdate = z.object({
	desktop: layoutArrangementSchema.optional(),
	mobile: layoutArrangementSchema.optional(),
	name: z.string().min(1).optional(),
});

export type Layout = InferSelectModel<typeof import("./layout.schema").layoutSchema>;
export type LayoutArrangement = z.infer<typeof layoutArrangementSchema>;
export type LayoutId = z.infer<typeof layoutIdSchema>;
