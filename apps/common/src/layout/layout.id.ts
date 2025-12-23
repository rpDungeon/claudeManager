import { z } from "zod";

import { createPrefixedId } from "../types/id.utils";

const LAYOUT_PREFIX = "layout";

export const layoutIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${LAYOUT_PREFIX}:`), "Invalid LayoutId")
	.brand("LayoutId");

export type LayoutId = z.infer<typeof layoutIdSchema>;

export const layoutIdGenerate = createPrefixedId(LAYOUT_PREFIX) as () => LayoutId;
