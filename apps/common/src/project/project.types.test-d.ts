import { expectTypeOf } from "expect-type";
import type { z } from "zod";

import { type ProjectId, projectIdGenerate, projectIdSchema } from "./project.id";

expectTypeOf(projectIdGenerate).toBeFunction();
expectTypeOf(projectIdGenerate).returns.toEqualTypeOf<ProjectId>();

expectTypeOf<ProjectId>().toMatchTypeOf<string>();
expectTypeOf<string>().not.toMatchTypeOf<ProjectId>();

expectTypeOf(projectIdSchema.parse("project:abc")).toEqualTypeOf<ProjectId>();

expectTypeOf<z.infer<typeof projectIdSchema>>().toEqualTypeOf<ProjectId>();

// @ts-expect-error - branded types are not assignable from plain strings
const _badId: ProjectId = "project:abc";
