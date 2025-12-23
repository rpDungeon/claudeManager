import { z } from "zod";

import { createPrefixedId } from "../types/id.utils";

const PROJECT_PREFIX = "project";

export const projectIdSchema = z
	.string()
	.refine((s) => s.startsWith(`${PROJECT_PREFIX}:`), "Invalid ProjectId")
	.brand("ProjectId");

export type ProjectId = z.infer<typeof projectIdSchema>;

export const projectIdGenerate = createPrefixedId(PROJECT_PREFIX) as () => ProjectId;
