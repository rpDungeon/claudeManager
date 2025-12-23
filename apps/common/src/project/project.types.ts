import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { layoutIdSchema } from "../layout/layout.id";

export const projectCreate = z.object({
	layoutId: layoutIdSchema.nullable().optional(),
	name: z.string().min(1),
	path: z.string().min(1),
});

export const projectPatch = z.object({
	layoutId: layoutIdSchema.nullable().optional(),
	name: z.string().min(1).optional(),
	path: z.string().min(1).optional(),
});

export type Project = InferSelectModel<typeof import("./project.schema").projectSchema>;
