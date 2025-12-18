import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import { createPrefixedId } from "../types/id.utils";

const PROJECT_PREFIX = "project";

export const projectIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${PROJECT_PREFIX}:`), "Invalid ProjectId")
	.brand("ProjectId");

export type ProjectId = z.infer<typeof projectIdSchema>;

export const projectIdGenerate = createPrefixedId(PROJECT_PREFIX) as () => ProjectId;

export const projectCreate = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
});

export const projectUpdate = projectCreate.extend({
	id: projectIdSchema,
});

export type Project = InferSelectModel<typeof import("./project.schema").projectSchema>;
